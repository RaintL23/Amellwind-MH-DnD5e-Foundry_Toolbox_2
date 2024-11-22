import "./App.css";
import Home from "./features/home/page";
import AppRouter from "./routes/routes";

function App() {
  return (
    // <Home></Home>
    <div className="app">
      <AppRouter />
    </div>
  );
}

export default App;
