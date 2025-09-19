/*global chrome*/
import React, { useState, useEffect, useRef } from 'react'
import { Container, Row } from 'react-bootstrap'
// import axios from 'axios'
import '../App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Moment from 'react-moment'
import moment from 'moment'
import EmptyNotification from './EmptyNotification'

function Notifications() {
  const [gmailData, setGmailData] = useState(null)
  const todayRef = useRef(false)
  const yesterdayRef = useRef(false)
  const thisWeekRef = useRef(false)
  const moreThanAWeekRef = useRef(false)

  const openSourcePage = (ref) => {
    window.open(ref, '_blank')
  }

  const setLastReadtime = () => {
    let lastReadTime = new Date();
    console.log(lastReadTime);
    chrome.storage.local.set({ readTime: new Date().toJSON() }, function () {
      console.log('read time set');
    })
  }

  useEffect(() => {
    // Check if Gmail is enabled first
    chrome.storage.local.get(['storage'], (storageResult) => {
      if (!storageResult.storage || !storageResult.storage.gmail) {
        return
      }

      fetch(`https://mail.google.com/mail/u/1/feed/atom`, {
        method: 'GET',
        headers: {
          'Accept': 'application/atom/xml, application/xml, text/xml'
        }
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok')
        }
        const xml = await res.text()
        
        // Parse the XML response manually without xml2js
        const parsedData = parseGmailFeed(xml)
        
        if (parsedData && parsedData.entries) {
          // Convert to the expected format
          const result = {
            feed: {
              entry: parsedData.entries
            }
          }
          setGmailData(result)

          setLastReadtime();
          chrome.action.setBadgeText({
            text:''
          })
        } else {
          console.log('No valid email data found in response')
        }
      }).catch((error) => {
        console.log('Gmail feed error:', error.message)
        // Don't set any data if there's an error
      })
    })
  }, [])

  const updateTodayFlag = () => {
    todayRef.current = true
  }

  const updateYesterdayFlag = () => {
    yesterdayRef.current = true
  }
  const updateWeekFlag = () => {
    thisWeekRef.current = true
  }

  const updateMoreThanAWeek = () => {
    moreThanAWeekRef.current = true
  }
  const numberOfDaysfromToday = (fromDate) => {
    const date1 = moment(new Date())
    const date2 = moment(fromDate)
    return date1.diff(date2, 'days')
  }

  
  var entrys =
    gmailData && gmailData.feed.entry
      ? gmailData.feed.entry
      : []
  return (
    <Container fixed="top"> 
      {console.log('inside empty',entrys.length)}
      {gmailData && entrys.length < 1?  <EmptyNotification/>: ''}
     
      {entrys.map((entry, index) => {
        return (
          <div key={index}>
            <Row className="row">
              {/* Today */}
              {!todayRef.current &&
              numberOfDaysfromToday(entry.issued[0]) === 0 ? (
                <div className="list-header">TODAY</div>
              ) : null}
              {!todayRef.current &&
              numberOfDaysfromToday(entry.issued[0]) === 0
                ? updateTodayFlag()
                : null}

              {/* {numberOfDaysfromToday(entry.issued[0])} */}
              {/* Yesterday */}
              {!yesterdayRef.current &&
              numberOfDaysfromToday(entry.issued[0]) === 1 ? (
                <div className="list-header">YESTERDAY</div>
              ) : null}
              {!yesterdayRef.current &&
              numberOfDaysfromToday(entry.issued[0]) === 1
                ? updateYesterdayFlag()
                : null}

              {/* this week */}
              {!thisWeekRef.current &&
              numberOfDaysfromToday(entry.issued[0]) > 1 &&
              numberOfDaysfromToday(entry.issued[0]) < 14 ? (
                <div className="list-header">THIS WEEK</div>
              ) : null}
              {!thisWeekRef.current &&
              numberOfDaysfromToday(entry.issued[0]) > 1 &&
              numberOfDaysfromToday(entry.issued[0]) < 14
                ? updateWeekFlag()
                : null}

              {/* older */}
              {!moreThanAWeekRef.current &&
              numberOfDaysfromToday(entry.issued[0]) >= 14 ? (
                <div className="list-header">OLDER</div>
              ) : null}
              {!moreThanAWeekRef.current &&
              numberOfDaysfromToday(entry.issued[0]) >= 14
                ? updateMoreThanAWeek()
                : null}
            </Row>
            <Row
              className="row"
              onClick={() => openSourcePage(entry.link[0].$.href)}
            >
              <div className="list-item">
                <div className="mager-content">
                  {entry.title[0].length > 42
                    ? entry.author[0].name[0] +
                      ': ' +
                      entry.title[0].substring(0, 42) +
                      '...'
                    : entry.author[0].name[0] + ': ' + entry.title[0]}
                  {/* <span className="tooltiptext">{entry.summary[0]}</span> */}
                </div>
                <div className="minor-content">
                  <Moment toNow>{entry.issued[0]}</Moment>{' '}
                  <strong>Gmail</strong>
                </div>
              </div>
            </Row>
            
          </div>
        )
      })}
    </Container>
  )
}

// Custom XML parser for Gmail Atom feed
function parseGmailFeed(xmlString) {
  try {
    // Check if the response contains valid XML
    if (!xmlString || !xmlString.includes('<?xml') || !xmlString.includes('<feed')) {
      console.log('Invalid XML response:', xmlString.substring(0, 200))
      return null
    }

    // Simple regex-based parsing for Gmail Atom feed
    const entryRegex = /<entry[^>]*>(.*?)<\/entry>/gs
    const entries = []
    let match

    while ((match = entryRegex.exec(xmlString)) !== null) {
      const entryXml = match[1]
      const entry = parseEntry(entryXml)
      if (entry) {
        entries.push(entry)
      }
    }

    return { entries }
  } catch (error) {
    console.log('Error parsing Gmail feed:', error)
    return null
  }
}

// Parse individual email entry
function parseEntry(entryXml) {
  try {
    const getTextContent = (tagName) => {
      const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 's')
      const match = entryXml.match(regex)
      return match ? match[1].trim() : ''
    }

    const getAttribute = (tagName, attrName) => {
      const regex = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"`, 's')
      const match = entryXml.match(regex)
      return match ? match[1] : ''
    }

    const id = getTextContent('id')
    const title = getTextContent('title')
    const summary = getTextContent('summary')
    const issued = getTextContent('issued')
    const modified = getTextContent('modified')
    
    // Parse author
    const authorName = getTextContent('name')
    const authorEmail = getTextContent('email')
    
    // Parse link
    const linkHref = getAttribute('link', 'href')

    if (!id || !title) {
      return null
    }

    return {
      id,
      title: [title],
      summary: summary ? [summary] : [''],
      issued: [issued],
      modified: [modified],
      author: [{
        name: [authorName],
        email: [authorEmail]
      }],
      link: [{
        $: { href: linkHref }
      }]
    }
  } catch (error) {
    console.log('Error parsing entry:', error)
    return null
  }
}

export default Notifications
