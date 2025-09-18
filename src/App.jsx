import React, { useEffect } from 'react'
import { Router } from "react-chrome-extension-router";
import NavigationBar from './components/NavigationBar'
import Welcome from './components/Welcome';
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  useEffect(() => {
    // componentDidMount logic here if needed
  }, [])

  return (
    <div className="App">
      <React.Fragment>
      <NavigationBar />
        <Router>
            <Welcome/>
        </Router>
      </React.Fragment>
    </div>
  )
}

export default App
