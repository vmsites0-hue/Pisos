import ngrok from '@ngrok/ngrok';

const authtoken = '3HuxgSlD6XFInqpTDMwTbljU5eF_YGJgrTrHEnkvYj8tAMuV';
const port = 3000;

async function start() {
  try {
    const listener = await ngrok.forward({
      addr: port,
      authtoken: authtoken,
    });
    console.log(`\n=========================================`);
    console.log(`NGROK TUNNEL ESTABLISHED: ${listener.url()}`);
    console.log(`=========================================\n`);
    // Keep the process alive indefinitely
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error('Error starting ngrok tunnel:', err);
  }
}

start();
