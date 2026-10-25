/** Props of a per-kind form: its own part of the state, controlled by the Customize dialog. */
export type FormProps<S> = { state: S; onChange: (next: S) => void }
