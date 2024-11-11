export interface Workflow<Params = unknown> {
	/**
	 * Get a handle to an existing instance of the Workflow.
	 * @param id Id for the instance of this Workflow
	 * @returns A promise that resolves with a handle for the Instance
	 */
	get(id: string): Promise<WorkflowInstance>
	/**
	 * Create a new instance and return a handle to it. If a provided id exists, an error will be thrown.
	 * @param options Options when creating an instance including id and params
	 * @returns A promise that resolves with a handle for the Instance
	 */
	create(options?: WorkflowInstanceCreateOptions<Params>): Promise<WorkflowInstance>
}

export interface WorkflowInstanceCreateOptions<Params> {
	/**
	 * An id for your Workflow instance. Must be unique within the Workflow.
	 */
	id?: string
	/**
	 * The event payload the Workflow instance is triggered with
	 */
	params?: Params
}
