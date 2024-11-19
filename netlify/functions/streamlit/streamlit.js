const { spawn } = require('child_process');
const path = require('path');

exports.handler = async function(event, context) {
  // Start Streamlit process
  const streamlit = spawn('streamlit', ['run', 'app.py', '--server.port', process.env.PORT || '8501']);

  // Handle stdout
  streamlit.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  // Handle stderr
  streamlit.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // Handle process exit
  streamlit.on('close', (code) => {
    console.log(`Streamlit process exited with code ${code}`);
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Streamlit server started" })
  };
};
