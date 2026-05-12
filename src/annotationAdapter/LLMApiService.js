// TODO: It may be place elsewhere
/**
 * Service class for communicating with the LLM API backend.
 */
export default class LLMApiService {
  /**
   * Creates an instance of LLMApiService.
   * @param {string} endpoint - The base URL of the FastAPI backend (e.g. 'http://localhost:8000/').
   */
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  /**
   * Sends a conversation to the LLM API and returns the response.
   * @param {Array<{role: string, content: string}>} messages - The conversation history.
   * @param {string} manifestUrl - The IIIF manifest URL providing image context.
   * @param {number} canvasIndex - The index of the active canvas in the manifest.
   * @returns {Promise<Object>} The JSON response from the LLM API.
   * @throws {Error} If the API request fails.
   */
  async callLLM(messages, manifestUrl, canvasIndex) {
    const res = await fetch(`${this.endpoint}chat`, {
      body: JSON.stringify({
        canvas_index: canvasIndex,
        conversation: messages,
        manifest_url: manifestUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('LLM request failed');
    }

    return res.json();
  }
}
