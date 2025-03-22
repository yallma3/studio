import yallma3logo from "/yaLLMa3.svg";
import "./App.css";

function App() {
  return (
    <>
      <div>
        <a href="https://yaLLMa3.org" target="_blank">
          <img src={yallma3logo} className="logo" alt="yaLLMa3 logo" />
        </a>
      </div>
      <h1>Build, Train, and Evolve Your Own Agentic AI</h1>
      <p className="read-the-docs">Click on yaLLMa3 logo to learn more</p>
    </>
  );
}

export default App;
