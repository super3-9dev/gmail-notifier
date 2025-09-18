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
  const [facebook, setFacebook] = useState(false)
  const [github, setGithub] = useState(false)
  const [isGmailLogedIn, setIsGmailLogedIn] = useState(false)
  const [infoModelState, setInfoModelState] = useState(false)

  const stateChange = () => {
    setIsChanged(true)
  }

  const handleChange = (e) => {
    console.log(e.target)
    const { name, checked } = e.target
    if (name === 'gmail') setGmail(checked)
    if (name === 'facebook') setFacebook(checked)
    if (name === 'github') setGithub(checked)
    updateLoginStatus()
    stateChange()
  }

  const updateLoginStatus = () => {
    let isGmailLogedIn = false
    axios
      .get('https://mail.google.com/mail/u/1/feed/atom')
      .then(function (response) {
        isGmailLogedIn = true
      })
      .catch(function (error) {
        isGmailLogedIn = false
      })
      .finally(() => {
        chrome.storage.local.set({ isGmailLogedIn }, () => {
          setIsGmailLogedIn(isGmailLogedIn)
        })
      })
  }

  const open = () => {
    console.log('open')
    setInfoModelState(true)
  }

  const close = () => {
    setInfoModelState(false)
  }
  
  const save = () => {
    let platforms = {
      gmail: gmail,
      facebook: facebook,
      github: github,
    }
    chrome.storage.local.set({ storage: platforms }, () => {
      goTo(Welcome)
    })
  }

  useEffect(() => {
    chrome.storage.local.get(['storage'], (result) => {
      if (result.storage) {
        setGmail(result.storage.gmail || false)
        setFacebook(result.storage.facebook || false)
        setGithub(result.storage.github || false)
      }
    })

    chrome.storage.local.get(['isGmailLogedIn'], (result) => {
      setIsGmailLogedIn(result.isGmailLogedIn || false)
    })
  }, [])

  return (
    <div>
      <div className="settings-description">
      Choose Gmail to receive notifications
      </div>
      <div className="list-header">
        PLATFORMS <Icon.InfoCircle onClick={open}/>
        
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
              <span className="label label-warning">Gmail is not logged in</span>
            )}
          </Form.Group>
        </Row>
        {/* <Form.Group className="mb-3" id="formGridCheckbox">
          <Form.Check
            onChange={handleChange}
            checked={facebook}
            type="checkbox"
            name="facebook"
            label="Facebook"
            disabled="true"
          />
        </Form.Group> */}
        {/* <Form.Group className="mb-3" id="formGridCheckbox">
          <Form.Check
            onChange={handleChange}
            checked={github}
            type="checkbox"
            name="github"
            label="github"
            disabled="true"
          />
        </Form.Group> */}
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
             setFacebook(result.storage.facebook || false)
             setGithub(result.storage.github || false)
           }
         })

         chrome.storage.local.get(['isGmailLogedIn'], (result) => {
           setIsGmailLogedIn(result.isGmailLogedIn || false)
         })
       }}
      ></SettinngsInfo>
      {/* <settinngsInfo
        show={infoModelState}
        onHide={close}
        refersh={() => {
          chrome.storage.local.get(['storage'], (result) => {
            setGmail(result.storage.gmail)
            setFacebook(result.storage.facebook)
            setGithub(result.storage.github)
          })

          chrome.storage.local.get(['isGmailLogedIn'], (result) => {
            setIsGmailLogedIn(result.isGmailLogedIn)
          })
        }}
      ></settinngsInfo> */}
      
    </div>
  )
}

export default Settings
