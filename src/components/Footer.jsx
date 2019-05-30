import React from 'react';
import {Container, Row, Col} from 'reactstrap'

const Footer = (props) => {
  return <div className="footer">
  <Container>
    <Row>
      <Col sm={6} className="text-left">
        <p>Made with &#x2764; by <a target="_blank" href="https://twitter.com/loubserian">loubserian</a></p>
      </Col>
      <Col sm={6} className="text-right">
      data provided by <a target="_blank" href="https://twitter.com/rdutel/">rdutel</a> from <a target="_blank" href="https://remotive.io">remotive.io</a>
      </Col>
    </Row>
  </Container>
  </div>
}

export default Footer;