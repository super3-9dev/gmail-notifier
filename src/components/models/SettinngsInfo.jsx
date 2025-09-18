import React from 'react'
import { Modal, Button } from 'react-bootstrap'

function SettinngsInfo(props) {
  console.log('here inside model');

  return (
    <Modal
    {...props}
    aria-labelledby="contained-modal-title-vcenter"
    centered
    >
      <Modal.Dialog>
        <Modal.Header closeButton>
          <Modal.Title>Gmail Login Status</Modal.Title>
        </Modal.Header>

        <Modal.Body>
              <strong>How to enable Gmail notifications:</strong><br/><br/>
              1. <strong>First:</strong> Open Gmail in a new tab at <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">mail.google.com</a> and make sure you're logged in<br/>
              2. <strong>Then:</strong> Come back to this extension and check the "Gmail" checkbox above<br/>
              3. Click "Save"<br/><br/>
              
              <strong>How to enable Telegram notifications:</strong><br/><br/>
              1. <strong>Create a Telegram Bot:</strong> Message @BotFather on Telegram and create a new bot with /newbot command<br/>
              2. <strong>Get your Chat ID:</strong> Message @userinfobot to get your Chat ID<br/>
              3. <strong>Configure:</strong> Enter your Bot Token and Chat ID in the Telegram settings above<br/>
              4. <strong>Test:</strong> Click "Test Connection" to verify everything works<br/>
              5. <strong>Enable:</strong> Check the "Send notifications to Telegram" checkbox<br/><br/>
              
              <strong>Important:</strong> The extension needs you to be logged into Gmail in your browser first. 
              If you see "Gmail is not logged in", it means you need to open Gmail in a tab and log in there first.
              <br/><br/>
              <strong>Note:</strong> The browser may show a login popup - you can safely close it. 
              The extension will work once you're logged into Gmail in a regular tab.
        </Modal.Body>

        <Modal.Footer>
          <Button  className="btn btn-warning save-btn" onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  )
}

export default SettinngsInfo
