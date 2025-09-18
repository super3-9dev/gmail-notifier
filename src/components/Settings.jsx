/*global chrome*/
import React, { useState, useEffect } from 'react'
import { Button, Form, Col, Row } from 'react-bootstrap'
import { goTo } from 'react-chrome-extension-router'
import * as Icon from 'react-bootstrap-icons';
import '../App.css'

import Welcome from './Welcome'
import axios from 'axios'
import SettinngsInfo from './models/SettinngsInfo'

function Settings() {
  const [isChanged, setIsChanged] = useState(false)
  const [gmail, setGmail] = useState(false)
  const [isGmailLogedIn, setIsGmailLogedIn] = useState(false)
  const [infoModelState, setInfoModelState] = useState(false)
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramTestStatus, setTelegramTestStatus] = useState('')

  const stateChange = () => {
    setIsChanged(true)
  }

  const handleChange = (e) => {
    console.log(e.target)
    const { name, checked } = e.target
    if (name === 'gmail') {
      setGmail(checked)
      // Only check login status when enabling Gmail
      if (checked) {
        updateLoginStatus()
      } else {
        // Reset login status when disabling
        setIsGmailLogedIn(false)
        chrome.storage.local.set({ isGmailLogedIn: false }, () => {})
      }
    } else if (name === 'telegram') {
      setTelegramEnabled(checked)
    }
    stateChange()
  }

  const handleTelegramInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'telegramBotToken') {
      setTelegramBotToken(value)
    } else if (name === 'telegramChatId') {
      setTelegramChatId(value)
    }
    stateChange()
  }

  const updateLoginStatus = () => {
    // First check if we already have a stored login status
    chrome.storage.local.get(['isGmailLogedIn'], (storedResult) => {
      if (storedResult.isGmailLogedIn) {
        // User was previously logged in, keep that status
        setIsGmailLogedIn(true)
        return
      }

      // If no stored status, check if user is on Gmail page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0]
        if (currentTab && currentTab.url && currentTab.url.includes('mail.google.com')) {
          // User is on Gmail, assume they're logged in
          const isGmailLogedIn = true
          chrome.storage.local.set({ isGmailLogedIn }, () => {
            setIsGmailLogedIn(isGmailLogedIn)
          })
        } else {
          // Try to check login status via the Atom feed with better error handling
          axios
            .get('https://mail.google.com/mail/u/1/feed/atom', {
              timeout: 5000,
              headers: {
                'Accept': 'application/atom+xml, application/xml, text/xml'
              }
            })
            .then(function (response) {
              const isGmailLogedIn = true
              chrome.storage.local.set({ isGmailLogedIn }, () => {
                setIsGmailLogedIn(isGmailLogedIn)
              })
            })
            .catch(function (error) {
              console.log('Gmail login check failed:', error.message)
              // Don't set to false immediately, let the user try again
              // Only set to false if it's a clear authentication error
              if (error.response && error.response.status === 401) {
                const isGmailLogedIn = false
                chrome.storage.local.set({ isGmailLogedIn }, () => {
                  setIsGmailLogedIn(isGmailLogedIn)
                })
              }
            })
        }
      })
    })
  }

  const open = () => {
    console.log('open')
    setInfoModelState(true)
  }

  const refreshLoginStatus = () => {
    // Force refresh login status
    chrome.storage.local.remove(['isGmailLogedIn'], () => {
      updateLoginStatus()
    })
  }

  const testTelegramConnection = async () => {
    if (!telegramBotToken || !telegramChatId) {
      setTelegramTestStatus('Please enter both Bot Token and Chat ID')
      return
    }

    setTelegramTestStatus('Testing...')
    
    try {
      const response = await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        chat_id: telegramChatId,
        text: '🔔 Blue Bell Gmail Notifier test message!\n\nIf you receive this, your Telegram integration is working correctly.',
        parse_mode: 'HTML'
      })

      if (response.data.ok) {
        setTelegramTestStatus('✅ Telegram connection successful!')
        // Save the settings
        chrome.storage.local.set({ 
          telegramEnabled: true,
          telegramBotToken: telegramBotToken,
          telegramChatId: telegramChatId
        }, () => {
          console.log('Telegram settings saved')
        })
      } else {
        setTelegramTestStatus('❌ Failed to send message')
      }
    } catch (error) {
      console.log('Telegram test error:', error)
      setTelegramTestStatus('❌ Connection failed. Check your Bot Token and Chat ID')
    }
  }

  const close = () => {
    setInfoModelState(false)
  }
  
  const save = () => {
    let platforms = {
      gmail: gmail,
    }
    
    // Save both Gmail and Telegram settings
    chrome.storage.local.set({ 
      storage: platforms,
      telegramEnabled: telegramEnabled,
      telegramBotToken: telegramBotToken,
      telegramChatId: telegramChatId
    }, () => {
      goTo(Welcome)
    })
  }

  useEffect(() => {
    chrome.storage.local.get(['storage'], (result) => {
      if (result.storage) {
        setGmail(result.storage.gmail || false)
      }
    })

    chrome.storage.local.get(['isGmailLogedIn'], (result) => {
      setIsGmailLogedIn(result.isGmailLogedIn || false)
    })

    // Load Telegram settings
    chrome.storage.local.get(['telegramEnabled', 'telegramBotToken', 'telegramChatId'], (result) => {
      setTelegramEnabled(result.telegramEnabled || false)
      setTelegramBotToken(result.telegramBotToken || '')
      setTelegramChatId(result.telegramChatId || '')
    })
  }, [])

  return (
    <div>
      <div className="settings-description">
      Enable Gmail notifications
      </div>
      <div className="list-header">
        GMAIL NOTIFICATIONS <Icon.InfoCircle onClick={open}/>
        
      </div>
      <div className="platform-item">
        <Row className="mb-3">
          <Form.Group as={Col} id="formGridCheckbox">
            <Form.Check
              onChange={handleChange}
              checked={gmail}
              type="checkbox"
              name="gmail"
              label="Gmail"
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridCity">
            {!gmail ? (
              ''
            ) : isGmailLogedIn ? (
              <span className="label label-success"> Sync</span>
            ) : (
              <div>
                <span className="label label-warning">Gmail is not logged in</span>
                <button 
                  className="btn btn-sm btn-outline-primary ms-2" 
                  onClick={refreshLoginStatus}
                  style={{ fontSize: '10px', padding: '2px 6px' }}
                >
                  Refresh
                </button>
              </div>
            )}
          </Form.Group>
        </Row>
      </div>
      
      {/* Telegram Settings Section */}
      <div className="list-header" style={{ marginTop: '20px' }}>
        TELEGRAM NOTIFICATIONS <Icon.InfoCircle onClick={open}/>
      </div>
      <div className="platform-item">
        <Row className="mb-3">
          <Form.Group as={Col} id="formGridCheckbox">
            <Form.Check
              onChange={handleChange}
              checked={telegramEnabled}
              type="checkbox"
              name="telegram"
              label="Send notifications to Telegram"
            />
          </Form.Group>
        </Row>
        
        {telegramEnabled && (
          <div style={{ marginTop: '15px' }}>
            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label>Bot Token</Form.Label>
                <Form.Control
                  type="password"
                  name="telegramBotToken"
                  value={telegramBotToken}
                  onChange={handleTelegramInputChange}
                  placeholder="Enter your Telegram Bot Token"
                />
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label>Chat ID</Form.Label>
                <Form.Control
                  type="text"
                  name="telegramChatId"
                  value={telegramChatId}
                  onChange={handleTelegramInputChange}
                  placeholder="Enter your Telegram Chat ID"
                />
              </Form.Group>
            </Row>
            
            <Row className="mb-3">
              <Form.Group as={Col}>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={testTelegramConnection}
                  disabled={!telegramBotToken || !telegramChatId}
                >
                  Test Connection
                </Button>
                {telegramTestStatus && (
                  <span className="ms-2" style={{ fontSize: '12px' }}>
                    {telegramTestStatus}
                  </span>
                )}
              </Form.Group>
            </Row>
            
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              <strong>How to get Bot Token and Chat ID:</strong><br/>
              1. Message @BotFather on Telegram<br/>
              2. Create a new bot with /newbot command<br/>
              3. Get your Bot Token from BotFather<br/>
              4. Message your bot and get Chat ID from @userinfobot
            </div>
          </div>
        )}
      </div>
      
      <div className="settings-save">
        <Button
          className="btn btn-warning save-btn"
          type="submit"
          onClick={save}
        >
          {isChanged ? 'Save' : 'Cancel'}
        </Button>
      </div>
      <div className ="version">
        Version 0.1.1
      </div>
      <SettinngsInfo
       show={infoModelState}
       onHide={close}
       refersh={() => {
         chrome.storage.local.get(['storage'], (result) => {
           if (result.storage) {
             setGmail(result.storage.gmail || false)
           }
         })

         chrome.storage.local.get(['isGmailLogedIn'], (result) => {
           setIsGmailLogedIn(result.isGmailLogedIn || false)
         })
       }}
      ></SettinngsInfo>
    </div>
  )
}

export default Settings
