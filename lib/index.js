/**
 * Host half of dsh-question-voice.
 *
 * The whole feature lives in the browser: the answer card's microphone button
 * records with MediaRecorder, asks the speech remote that the voice-input
 * plugin already mounts, and writes the transcript into the card's textarea.
 * The host side exists so the package can declare a `dsh.client` entry and be
 * mounted as an ordinary plugin row.
 */
export const name = 'dsh-question-voice'

/** Nothing to install on the host. */
export function apply() {}
