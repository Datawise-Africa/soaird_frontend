export const loader = async () => {
  return new Response(
    JSON.stringify({
      name: 'Chrome DevTools App Specific Configuration',
      version: '1.0',
      manifest_version: 1,
      app: {
        launch: {
          web_url: 'https://datawiseafrica.com',
        },
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
