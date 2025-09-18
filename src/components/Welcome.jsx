/*global chrome*/
import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { goTo } from 'react-chrome-extension-router'
import Settings from './Settings'
import '../App.css'
import Notifications from './Notifications'
import 'bootstrap/dist/css/bootstrap.min.css'

function Welcome() {
  const [enabled, setEnabled] = useState(false)
  const [isGmailLogedIn, setIsGmailLogedIn] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['storage'], (result) => {
      if (result.storage && result.storage.gmail) {
        setEnabled(true)
      }
    })

    chrome.storage.local.get(['isGmailLogedIn'], (result) => {
      setIsGmailLogedIn(result.isGmailLogedIn || false)
    })
  }, [])

  const welcomePage = () => {
    return (
      <div className="text-center">
        <img
          src="/img/notification.png"
          alt="bg"
          className="welcome-image "
        ></img>
        <div>
          <h2>Enable notifications</h2>
          <p>
          Make sure you're logged into Gmail. Navigate to settings and allow Extention to read Gmail notifications.
          </p>
        </div>
        <div>
          <button className="btn btn-warning" onClick={() => goTo(Settings)}>
            <FontAwesomeIcon icon="globe" /> Settings
          </button>
        </div>
      </div>
    )
  }

  return enabled && isGmailLogedIn ? (
    <Notifications />
  ) : (
    welcomePage()
  )
}

export default Welcome
