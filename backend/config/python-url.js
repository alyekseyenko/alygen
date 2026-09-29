/**
 * URL única do motor FastAPI (porta 3003 por defeito).
 */
export function getPythonFastApiUrl() {
  return (
    process.env.PYTHON_FASTAPI_URL ||
    process.env.PYTHON_SERVICE_URL ||
    `http://localhost:${process.env.PYTHON_PORT || '3003'}`
  );
}

export default getPythonFastApiUrl;
