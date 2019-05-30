import React from 'react';
import {Navbar, NavbarToggler, NavbarBrand,
        Nav, NavItem, NavLink, Collapse} from 'reactstrap'

import 'bootstrap/dist/css/bootstrap.css'

export default class TopNav extends React.Component {

  state = {
    isOpen: false
  }

  render() {
    return <Navbar color="light" light expand="md">
      <NavbarBrand href="/"><img src="/doge.png" style={{maxHeight: "50px"}}/> Remote Working Stats</NavbarBrand>
      <NavbarToggler/>
      <Collapse isOpen={this.state.isOpen} navbar>
        <Nav className="ml-auto" navbar>
          <NavItem>
            <NavLink href="https://docs.google.com/spreadsheets/d/1TLJSlNxCbwRNxy14Toe1PYwbCTY7h0CNHeer9J0VRzE/edit">
              Remote Companies
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://docs.google.com/spreadsheets/d/1VOehQv0bOs2pY7RkKJ8RmlUbuu8UmSgzfvjR0m5hyxQ/edit">
              Remote Salaries
            </NavLink>
          </NavItem>
        </Nav>
      </Collapse>
    </Navbar>
  }
}
