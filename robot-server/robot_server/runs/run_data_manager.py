"""Manage current and historical run data."""
from datetime import datetime
from typing import List, Optional, Callable, Union

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.errors.exceptions import InvalidStoredData, EnumeratedError
from opentrons.protocol_engine import (
    EngineStatus,
    LabwareOffsetCreate,
    StateSummary,
    CommandSlice,
    CurrentCommand,
    Command,
)
from opentrons.protocol_engine.types import RunTimeParamValuesType

from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.service.task_runner import TaskRunner
from robot_server.service.notifications import RunsPublisher

from .engine_store import EngineStore
from .run_store import RunResource, RunStore, BadRunResource, BadStateSummary
from .run_models import Run, BadRun, RunDataError

from opentrons.protocol_engine.types import DeckConfigurationType, RunTimeParameter


def _build_run(
    run_resource: Union[RunResource, BadRunResource],
    state_summary: Union[StateSummary, BadStateSummary],
    current: bool,
    run_time_parameters: List[RunTimeParameter],
) -> Union[Run, BadRun]:
    # TODO(mc, 2022-05-16): improve persistence strategy
    # such that this default summary object is not needed

    if run_resource.ok and isinstance(state_summary, StateSummary):
        return Run.construct(
            id=run_resource.run_id,
            protocolId=run_resource.protocol_id,
            createdAt=run_resource.created_at,
            actions=run_resource.actions,
            status=state_summary.status,
            errors=state_summary.errors,
            labware=state_summary.labware,
            labwareOffsets=state_summary.labwareOffsets,
            pipettes=state_summary.pipettes,
            modules=state_summary.modules,
            current=current,
            completedAt=state_summary.completedAt,
            startedAt=state_summary.startedAt,
            liquids=state_summary.liquids,
            runTimeParameters=run_time_parameters,
        )

    errors: List[EnumeratedError] = []
    if isinstance(state_summary, BadStateSummary):
        state = StateSummary.construct(
            status=EngineStatus.STOPPED,
            errors=[],
            labware=[],
            labwareOffsets=[],
            pipettes=[],
            modules=[],
            liquids=[],
        )
        errors.append(state_summary.dataError)
    else:
        state = state_summary
    if not run_resource.ok:
        errors.append(run_resource.error)

    if len(errors) > 1:
        run_loading_error = RunDataError.from_exc(
            InvalidStoredData(
                message=(
                    "Data on this run is not valid. The run may have been "
                    "created on a future software version."
                ),
                wrapping=errors,
            )
        )
    elif errors:
        run_loading_error = RunDataError.from_exc(errors[0])
    else:
        # We should never get here
        run_loading_error = RunDataError.from_exc(
            AssertionError("Logic error in parsing invalid run.")
        )

    return BadRun.construct(
        dataError=run_loading_error,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=state.status,
        errors=state.errors,
        labware=state.labware,
        labwareOffsets=state.labwareOffsets,
        pipettes=state.pipettes,
        modules=state.modules,
        current=current,
        completedAt=state.completedAt,
        startedAt=state.startedAt,
        liquids=state.liquids,
        runTimeParameters=run_time_parameters,
    )


class RunNotCurrentError(ValueError):
    """Error raised when a requested run is not the current run."""


class RunDataManager:
    """Collaborator to manage current and historical run data.

    Provides a facade to both an EngineStore (current run) and a RunStore
    (historical runs). Returns `Run` response models to the router.

    Args:
        engine_store: In-memory store of the current run's ProtocolEngine.
        run_store: Persistent database of current and historical run data.
    """

    def __init__(
        self,
        engine_store: EngineStore,
        run_store: RunStore,
        task_runner: TaskRunner,
        runs_publisher: RunsPublisher,
    ) -> None:
        self._engine_store = engine_store
        self._run_store = run_store
        self._task_runner = task_runner
        self._runs_publisher = runs_publisher

    @property
    def current_run_id(self) -> Optional[str]:
        """The identifier of the current run, if any."""
        return self._engine_store.current_run_id

    async def create(
        self,
        run_id: str,
        created_at: datetime,
        labware_offsets: List[LabwareOffsetCreate],
        deck_configuration: DeckConfigurationType,
        run_time_param_values: Optional[RunTimeParamValuesType],
        notify_publishers: Callable[[], None],
        protocol: Optional[ProtocolResource],
    ) -> Union[Run, BadRun]:
        """Create a new, current run.

        Args:
            run_id: Identifier to assign the new run.
            created_at: Creation datetime.
            labware_offsets: Labware offsets to initialize the engine with.
            deck_configuration: A mapping of fixtures to cutout fixtures the deck will be loaded with.
            notify_publishers: Utilized by the engine to notify publishers of state changes.
            run_time_param_values: Any runtime parameter values to set.
            protocol: The protocol to load the runner with, if any.

        Returns:
            The run resource.

        Raise:
            EngineConflictError: There is a currently active run that cannot
                be superceded by this new run.
        """
        prev_run_id = self._engine_store.current_run_id
        if prev_run_id is not None:
            prev_run_result = await self._engine_store.clear()
            self._run_store.update_run_state(
                run_id=prev_run_id,
                summary=prev_run_result.state_summary,
                commands=prev_run_result.commands,
                run_time_parameters=prev_run_result.parameters,
            )
        state_summary = await self._engine_store.create(
            run_id=run_id,
            labware_offsets=labware_offsets,
            deck_configuration=deck_configuration,
            protocol=protocol,
            run_time_param_values=run_time_param_values,
            notify_publishers=notify_publishers,
        )
        run_resource = self._run_store.insert(
            run_id=run_id,
            created_at=created_at,
            protocol_id=protocol.protocol_id if protocol is not None else None,
        )
        await self._runs_publisher.initialize(
            get_current_command=self.get_current_command,
            get_state_summary=self._get_good_state_summary,
            run_id=run_id,
        )

        return _build_run(
            run_resource=run_resource,
            state_summary=state_summary,
            current=True,
            run_time_parameters=[],
        )

    def get(self, run_id: str) -> Union[Run, BadRun]:
        """Get a run resource.

        This method will pull from the current run or the historical runs,
        depending on if `run_id` refers to the current run.

        Args:
            run_id: The identifier of the run to return.

        Returns:
            The run resource.

        Raises:
            RunNotFoundError: The given run identifier does not exist.
        """
        run_resource = self._run_store.get(run_id=run_id)
        state_summary = self._get_state_summary(run_id=run_id)
        parameters = self._get_run_time_parameters(run_id=run_id)
        current = run_id == self._engine_store.current_run_id

        return _build_run(run_resource, state_summary, current, parameters)

    def get_run_loaded_labware_definitions(
        self, run_id: str
    ) -> List[LabwareDefinition]:
        """Get a run's load labware definitions.

        This method will get the labware definitions loaded by loadLabware commands for the current run
        depending on if `run_id` refers to the current run.

        Args:
            run_id: The identifier of the run to return.

        Returns:
            The run's loaded labware definitions.

        Raises:
            RunNotCurrentError: The given run identifier is not the current run.
        """
        # The database doesn't store runs' loaded labware definitions in a way that we
        # can query quickly. Avoid it by only supporting this on in-memory runs.
        if run_id != self._engine_store.current_run_id:
            raise RunNotCurrentError(
                f"Cannot get load labware definitions of {run_id} because it is not the current run."
            )

        return (
            self._engine_store.engine.state_view.labware.get_loaded_labware_definitions()
        )

    def get_all(self, length: Optional[int]) -> List[Union[Run, BadRun]]:
        """Get current and stored run resources.

        Results are ordered from oldest to newest.

        Params:
            length: If `None`, return all runs. Otherwise, return the newest n runs.
        """
        return [
            _build_run(
                run_resource=run_resource,
                state_summary=self._get_state_summary(run_resource.run_id),
                current=run_resource.run_id == self._engine_store.current_run_id,
                run_time_parameters=self._get_run_time_parameters(run_resource.run_id),
            )
            for run_resource in self._run_store.get_all(length)
        ]

    async def delete(self, run_id: str) -> None:
        """Delete a current or historical run.

        Args:
            run_id: The identifier of the run to remove.

        Raises:
            EngineConflictError: If deleting the current run, the current run
                is not idle and cannot be deleted.
            RunNotFoundError: The given run identifier was not found in the database.
        """
        if run_id == self._engine_store.current_run_id:
            await self._engine_store.clear()
            await self._runs_publisher.clean_up_current_run()

        self._run_store.remove(run_id=run_id)

    async def update(self, run_id: str, current: Optional[bool]) -> Union[Run, BadRun]:
        """Get and potentially archive a run.

        Args:
            run_id: The run to get and maybe archive.

        Returns:
            The updated run.

        Raises:
            RunNotFoundError: The run identifier was not found in the database.
            RunNotCurrentError: The run is not the current run.
            EngineConflictError: The run cannot be updated because it is not idle.
        """
        if run_id != self._engine_store.current_run_id:
            raise RunNotCurrentError(
                f"Cannot update {run_id} because it is not the current run."
            )

        next_current = current if current is False else True

        if next_current is False:
            commands, state_summary, parameters = await self._engine_store.clear()
            run_resource: Union[
                RunResource, BadRunResource
            ] = self._run_store.update_run_state(
                run_id=run_id,
                summary=state_summary,
                commands=commands,
                run_time_parameters=parameters,
            )
        else:
            state_summary = self._engine_store.engine.state_view.get_summary()
            parameters = self._engine_store.runner.run_time_parameters
            run_resource = self._run_store.get(run_id=run_id)

        return _build_run(
            run_resource=run_resource,
            state_summary=state_summary,
            current=next_current,
            run_time_parameters=parameters,
        )

    def get_commands_slice(
        self,
        run_id: str,
        cursor: Optional[int],
        length: int,
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            run_id: ID of the run.
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
        """
        if run_id == self._engine_store.current_run_id:
            the_slice = self._engine_store.engine.state_view.commands.get_slice(
                cursor=cursor, length=length
            )
            return the_slice

        # Let exception propagate
        return self._run_store.get_commands_slice(
            run_id=run_id, cursor=cursor, length=length
        )

    def get_current_command(self, run_id: str) -> Optional[CurrentCommand]:
        """Get the currently executing command, if any.

        Args:
            run_id: ID of the run.
        """
        if self._engine_store.current_run_id == run_id:
            return self._engine_store.engine.state_view.commands.get_current()
        return None

    def get_command(self, run_id: str, command_id: str) -> Command:
        """Get a run's command by ID.

        Args:
            run_id: ID of the run.
            command_id: ID of the command.

        Raises:
            RunNotFoundError: The given run identifier was not found.
            CommandNotFoundError: The given command identifier was not found.
        """
        if self._engine_store.current_run_id == run_id:
            return self._engine_store.engine.state_view.commands.get(
                command_id=command_id
            )

        return self._run_store.get_command(run_id=run_id, command_id=command_id)

    def _get_state_summary(self, run_id: str) -> Union[StateSummary, BadStateSummary]:
        if run_id == self._engine_store.current_run_id:
            return self._engine_store.engine.state_view.get_summary()
        else:
            return self._run_store.get_state_summary(run_id=run_id)

    def _get_good_state_summary(self, run_id: str) -> Optional[StateSummary]:
        summary = self._get_state_summary(run_id)
        return summary if isinstance(summary, StateSummary) else None

    def _get_run_time_parameters(self, run_id: str) -> List[RunTimeParameter]:
        if run_id == self._engine_store.current_run_id:
            return self._engine_store.runner.run_time_parameters
        else:
            return self._run_store.get_run_time_parameters(run_id=run_id)
