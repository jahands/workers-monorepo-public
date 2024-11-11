// This exports any APIs we need from otel-cf-workers and otel libs.
// This is a workaround due to vitest trying to load files meant for
// node environments and failing because workerd does not have them.

export { instrument, instrumentDO } from '@microlabs/otel-cf-workers'
export type { ResolveConfigFn } from '@microlabs/otel-cf-workers'

export { trace } from '@opentelemetry/api'
export type { Tracer } from '@opentelemetry/api'
