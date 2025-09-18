/*global chrome*/
import React, { useState, useEffect, useRef } from 'react'
import { Container, Row } from 'react-bootstrap'
import axios from 'axios'
import xml2js from 'xml2js'
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

      axios.get(`https://mail.google.com/mail/u/1/feed/atom`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/atom+xml, application/xml, text/xml'
        }
      }).then((res) => {
        const xml = res.data
        xml2js.parseString(xml, (err, result) => {
          if (err) {
            console.log('XML parsing error:', err)
            return
          }
          setGmailData(result)

          setLastReadtime();
          chrome.action.setBadgeText({
            text:''
          })
        })
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

export default Notifications
