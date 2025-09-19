import React from 'react'
import { Nav, Navbar } from 'react-bootstrap'
import styled from 'styled-components'
import { goTo } from 'react-chrome-extension-router'
import Settings from './Settings'
import * as Icon from 'react-bootstrap-icons';

function NavigationBar() {
  const menu = () => {
    goTo(Settings)
  }

  const Styles = styled.div`
    .navbar {
      background-color: #337ab7;
    }
    a,
    .navbar-brand,
    .navbar-nav,
    .nav-link {
      color: white;
      padding-left: 15px;
      &:hover {
        color: white;
      }
    }

    #nav-dropdown {
      color: white;
    }
    .dropdown-item {
      color: black;
      &:hover {
        background-color: #337ab7;
      }
    }
  `

  return (
    <Styles>
      <Navbar expand="rg" >
        <Navbar.Brand >Nova Pure Speed</Navbar.Brand>
        <Nav.Link onClick={menu}><Icon.Gear/></Nav.Link>
      </Navbar>
    </Styles>
  )
}

export default NavigationBar
