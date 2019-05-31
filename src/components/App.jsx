import React, { Component } from 'react';
import {Container, Row, Col, Card, CardBody, Label, Table,
    TabContent, TabPane, Button, UncontrolledCollapse} from 'reactstrap'
import Select from 'react-select'
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table'

import {Chart} from 'react-google-charts'
import 'bootstrap/dist/css/bootstrap.css'
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css'

import { median } from '../lib/math'
import sani from '../lib/sani'


import TopNav from './TopNav'
import Footer from './Footer'
import {table_headers, header_options} from '../data/constants'

const salariesSheetId = "16G5epyOKvzvNsmJ8ib-y5m59kg1W4XW7nynsAzURHHw";
const hiringSheetId = "1TLJSlNxCbwRNxy14Toe1PYwbCTY7h0CNHeer9J0VRzE";
const apiKey = "AIzaSyCGSp7L1T4QkANqkczX16Dq5IkrTS-8ElI";
const mapsKey = "AIzaSyA1ZaVaIWBRYoDZsN-zpq3gipFBGXTNJbY";


const pieChartDetails = {
  category: {
    title: "Job Categories",
    description: "Job categories representation in data."
  },
  salary_emotion: {
    title: "Feelings about $$",
    description: "Employee feelings about salary."
  },
  nomad: {
    title: "Nomad Lifestyle",
    description: "Employees living as digital nomads."
  },
  non_global: {
    title: " Countries",
    description: "Amount of companies hiring from other countries."
  }
}


const CustomToolbar = (props, selectedHeaders, filterCount, onFilterCharts, onChange) => {
  return (
    <Col sm={12}>
      <Row>
        <Col lg={10} sm={6}>
          {props.components.searchPanel}
        </Col>
        <Col lg={2} sm={6}>
          <Button id="showTableConfig" color="secondary" outline>Table Options</Button>
        </Col>
        <Col sm={12}>
          <i>{filterCount} data points</i> 
          <Button size="sm" color="link" onClick={onFilterCharts}><i>Update above charts from filtered table data</i></Button>
        </Col>
      </Row>
      <UncontrolledCollapse className="table-config" toggler="showTableConfig">
        <br/>
        <Label>Choose table columns to show:</Label>
        <Select options={header_options} 
              value={selectedHeaders}
              isMulti
              onChange={onChange}
              name="colors"/>
        <br/>
      </UncontrolledCollapse>
    </Col>
  )
}

class App extends Component {

  filterCountT = null;

  state = {
    selectedHeaders: [
      {value: "job_title", label: "Job Title"},
      {value: "category", label: "Category"},
      {value: "experience_years", label: "Experience years"},
      {value: "located", label: "Employee Location"},
      {value: "company_hq", label: "Company HQ"},
      {value: "company_size", label: "Company Size"},
      {value: "annual_salary", label: "Annual Salary"}
    ],
    categoryFilters: [],
    items: [],
    hiring: [],
    activeTab: "1",
    pieChartData: {},
    barChartData: [],
    geoPayAverage: [],
    geoPayMedian: [],
    geoWorkCount: [],
    geoHireChartData: [],
    filterCount: 0
  }

  componentDidMount() {
    window.gapi.load("client", () => {
      window.gapi.client.init({
        apiKey: apiKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      }).then(() => {
        window.gapi.client.load("sheets", "v4", () => {
          this.loadSheetData();
        })
      })
    })
  }

  onChangeSelectedCategories = () => {
    this.loadCharts()
  }

  loadSheetData = () => {
    window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: salariesSheetId,
      range: 'Remote workers salaries!A27:S',
      valueRenderOption: "UNFORMATTED_VALUE"
    }).then((response) => {
      return this.sanitize(response.result.values)
    }).then(() => {
      this.loadCharts()
    });

    window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: hiringSheetId,
      range: "'UPDATED - The List of Awesome!'!C3:O",
      valueRenderOption: "UNFORMATTED_VALUE"
    }).then((response) => {
      this.setState({
        hiring: response.result.values.map(item => (
          {
            cmp_name: item[0],
            cmp_twitter: item[3],
            cmp_size: item[4],
            bio: item[5],
            website: item[6],
            cmp_city: item[7],
            cmp_country: item[8],
            ceo_name: item[9],
            ceo_twitter: item[12]
          }
        ))
      })
    }).then(() => {
      this.calcGeoHiring();
    })
  }

  loadCharts = () => {
    this.calcPieChartForField("category")
    this.calcPieChartForField("salary_emotion")
    this.calcPieChartForField("nomad")
    this.calcPieNonRemote()
    this.calcGeoPay();
    this.calcGeoWork();
    this.setState({loadedData: true})
  }

  calcGeoHiring = () => {
    let tmp = {}
    this.state.hiring.map((item) => {
      let country = item.cmp_country

      if (item.cmp_country && item.cmp_country.toUpperCase() === "USA")
        country = "US"

      tmp[country] = tmp[country] ? tmp[country] + 1: 1
    })
    
    this.setState({geoHireChartData: Object.entries(tmp)})
  }

  calcGeoWork = (dataset=this.state.items) => {
    let avg = {}
    let result = []
    
    dataset.map((item) => {
      if (item.located)
        avg[item.located] = avg[item.located] ? [item.annual_salary, ...avg[item.located]] : [item.annual_salary]
    })

    Object.keys(avg).map(key => {
      let count = parseFloat(avg[key].length)
      let sum = avg[key].reduce((acc, val) => !isNaN(parseFloat(val)) ? parseFloat(acc) + parseFloat(val) : acc)
      result.push([key, count, (sum / count)])
    })
    
    this.setState({
      geoWorkCount: result
    })
  }

  calcGeoPay = (dataset=this.state.items) => {
    let tmp = {}
    
    dataset.map((item) => {
      if (item.company_hq)
        tmp[item.company_hq] = tmp[item.company_hq] ? [item.annual_salary, ...tmp[item.company_hq]] : [item.annual_salary]
    })

    let medians = {}
    let avg = []
    Object.keys(tmp).map(key => {
      let count = parseFloat(tmp[key].length)
      let sum = tmp[key].reduce((acc, val) => !isNaN(parseFloat(val)) ? parseFloat(acc) + parseFloat(val) : acc)
      medians[key] = median(tmp[key])
      avg.push([key, (sum / count), count])
    })


    
    this.setState({
      geoPayAverage: avg,
      geoPayMedian: Object.entries(medians)
    })
  }

  calcPieNonRemote = (dataset=this.state.items) => {
    let pieChartData = this.state.pieChartData
    let tmp = {
      "Other country": 0,
      "Same country": 0
    }

    dataset.map((item) => {
      if (item.company_hq && item.located) {
        if (item.company_hq.toUpperCase().trim() === item.located.toUpperCase().trim())
          tmp["Same country"] = tmp["Same country"] + 1
        else
          tmp["Other country"] = tmp["Other country"] + 1
      } else {
        tmp["Other country"] = tmp["Other country"] + 1
      }
    })
    
    pieChartData["non_global"] = Object.entries(tmp)
    this.setState({pieChartData})
  }

  calcPieChartForField = (field, dataset=this.state.items) => {
    let tmp = {}
    let pieChartData = this.state.pieChartData

    dataset.map((item) => {
      tmp[item[field]] = tmp[item[field]] ? tmp[item[field]] + 1: 1
    })

    pieChartData[field] = Object.entries(tmp)
    
    this.setState({pieChartData})
  }
  
  sanitize = (data) => {
    let cleaned = data.map((item,i) => {
      let d = {
        id: i,
        experience_level: item[0],
        category: item[1],
        job_title: item[2],
        company_size: item[3],
        funds_raised: item[4],
        annual_salary: item[5],
        company_hq: item[6],
        located: item[7] ? item[7].toUpperCase(): (item[8] ? item[8].toUpperCase() : "Unspecified"), // ? `${item[7]} - ${item[8]}` : 
        nomad: item[9],
        experience_years: item[10],
        period_employed: item[11],
        base_salary: item[12],
        equity_value: item[13],
        annual_bonus: item[14],
        gender: item[15],
        race: item[16],
        hours: item[17],
        salary_emotion: item[18]
      }

      let tmp = sani.clean([d], {
        annual_salary: sani.NUM,
        equity_value: sani.NUM,
        salary_emotion: sani.APPROX_MATCHES('Under paid', 'Over paid', 'Just right'),
        period_employed: sani.NUM,
        located: {
          before: (item) => {
            return item.located ? item.located.toUpperCase() : ""
          },
          ...sani.REPLACE_MATCH('US')
        },
        experience_years: sani.NUM,
        company_size: {
          after: (value) => {
            return value ? value[0] : value
          },
          ...sani.RANGE
        },
        company_hq: {
          before: (item) => {
            return item.company_hq ? item.company_hq.toUpperCase() : ""
          },
          ...sani.REPLACE_MATCH('US')
        },
        gender: sani.APPROX_MATCHES('Male', 'Female', 'Non-binary', 'Unspecified'),
        nomad: sani.APPROX_MATCHES('Yes', 'No', 'Other'),
        category: sani.APPROX_MATCHES("Developer", "Engineering", "Marketing", "Management", "Product", "Data", "Design", "Support", "Other"),
      })

      return Object.assign(d, tmp[0])
    })

    this.setState({
      items: cleaned,
      filterCount: cleaned.length
    })

    return Promise.resolve()
  }

  sorted = (chartData) => {
    return chartData.sort((a, b) => b[1] - a[1])
  }

  getFilteredCount = () => {
    if (this.filterCountT)
      clearTimeout(this.filterCountT)

    this.filterCountT = setTimeout(() => {
      if (this.state.loadedData){
        this.setState({
          filterCount: this.refs.table.getTableDataIgnorePaging().length
        })
      }
    }, 800)
  }

  toCurrency = (val) => {
    return val.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'symbol',
      useGrouping: true
    })
  }

  getChartsForFiltered = () => {
    const dataset = this.refs.table.getTableDataIgnorePaging()
    this.calcPieChartForField("category", dataset)
    this.calcPieChartForField("salary_emotion", dataset)
    this.calcPieChartForField("nomad", dataset)
    this.calcPieNonRemote(dataset)
    this.calcGeoPay(dataset);
    this.calcGeoWork(dataset);
  }

  render() {
    if (!this.state.loadedData) {
      return <div>
        <TopNav/>
        <Container className="content">
          <Row>
            <Col sm={12} className="loading">
              <h3>Loading data...</h3>
            </Col>
          </Row>
        </Container>
      </div>
    }

    return <div>
      <TopNav/>
      <Container className="content">
        <Row>
          {
            Object.keys(this.state.pieChartData).map(key => (
              <Col lg={3} sm={6} key={"pie-"+key}>
                <Card>
                  <CardBody className="text-center">
                    <h4>{pieChartDetails[key].title}</h4>
                    <i>{pieChartDetails[key].description}</i>
                    <Chart chartType="PieChart"
                      width={'100%'}
                      height={'200px'}
                      data={[
                        [table_headers[key], 'Count'],
                        ...this.state.pieChartData[key]
                      ]}
                      mapsApiKey={mapsKey}
                      options={{
                        legend: 'none'
                      }}
                    />
                  </CardBody>
                </Card>
              </Col>
            ))
          }
          <Col sm={12} className="text-center btn-bar">
            <Button color="secondary" 
                    onClick={() => this.setState({activeTab: "1"})}
                    outline={this.state.activeTab!=="1"}>
                      HQ Country Average Salary
            </Button>
            <Button color="secondary" 
                    onClick={() => this.setState({activeTab: "2"})}
                    outline={this.state.activeTab!=="2"}>
                      Remote Employee Countries
            </Button>
            <Button color="secondary" 
                    onClick={() => this.setState({activeTab: "3"})}
                    outline={this.state.activeTab!=="3"}>
                      Companies Hiring Remotely
            </Button>
          </Col>
          <Col sm={12}>
            <Card>
              <CardBody>
                <TabContent activeTab={this.state.activeTab}>
                  <TabPane tabId="1" className="text-center">
                    <h4>HQ Country Average Salary</h4>
                    <i>Average employee salary of company HQ</i>
                    <Row>
                      <Col lg={8} sm={12}>
                        <Chart chartType="GeoChart"
                          data={[
                            ['Country', 'Avg Salary', 'Employees'],
                            ...this.state.geoPayAverage
                          ]}
                        />
                      </Col>
                      <Col lg={4} sm={12}>
                        <b>10 highest averages</b>
                        <Table>
                          <tbody>
                          {
                            this.sorted(this.state.geoPayAverage).slice(0,10).map((item, i) => (
                              <tr key={i}>
                                <td>{i+1}.</td>
                                <td>{item[0]}</td>
                                <td>{this.toCurrency(item[1])}</td>
                              </tr>
                            )) 
                          }
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tabId="2" className="text-center">
                    <h4>Remote Employee Countries</h4>
                    <i>Number of employees working remotely from country.</i>
                    <Row>
                      <Col lg={8} sm={12}>
                        <Chart chartType="GeoChart"
                          data={[
                            ['Country', 'Employees', 'Avg Salary'],
                            ...this.state.geoWorkCount
                          ]}
                        />
                      </Col>
                      <Col lg={4} sm={12}>
                        <b>Top 10 countries to work from</b>
                        <Table>
                          <tbody>
                          {
                            this.sorted(this.state.geoWorkCount).slice(0,10).map((item, i) => (
                              <tr key={i}>
                                <td>{item[0]}</td>
                                <td>{item[1]}</td>
                              </tr>
                            )) 
                          }
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tabId="3" className="text-center">
                    <h4>Companies Hiring Remotely</h4>
                    <i>Number of companies hiring remotely.</i>
                    <Row>
                      <Col lg={8} sm={12}>
                        <Chart chartType="GeoChart"
                            data={[
                              ['Country', 'Count'],
                              ...this.state.geoHireChartData
                            ]}
                          />
                      </Col>
                      <Col lg={4} sm={12}>
                        <b>Top 10 hiring countries</b>
                        <Table>
                          <tbody>
                          {
                            this.sorted(this.state.geoHireChartData).slice(0,10).map((item, i) => (
                              <tr key={i}>
                                <td>{item[0]}</td>
                                <td>{item[1]}</td>
                              </tr>
                            )) 
                          }
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
          <Col sm={12}>
            <Card>
              <CardBody>
                <h4 className="ranking-title">&#x1F4B0; Remote Position Salaries</h4>
                <BootstrapTable className="data-table" data={this.state.items} version="4"
                    ref="table"
                    keyField="id"
                    search searchPlaceholder="Search ..."
                    striped pagination
                    options={{
                      searchDelayTime: 1000,
                      onFilterChange: this.getFilteredCount,
                      onSearchChange: this.getFilteredCount,
                      toolBar: (props) => (
                        CustomToolbar(props, this.state.selectedHeaders, 
                                      this.state.filterCount, 
                                      this.getChartsForFiltered,
                                      (i) => this.setState({selectedHeaders:i}),
                                  )
                      )
                    }}
                    onFilterChange={this.onFilter}>
                  {
                    this.state.selectedHeaders.map((header) => 
                      <TableHeaderColumn key={"header-"+header.value} 
                            dataSort={true} 
                            filter={ { type: 'TextFilter', delay: 400 } }
                            dataField={header.value}>
                            {header.label}
                      </TableHeaderColumn>
                    )
                  }
                </BootstrapTable>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer/>
    </div>
  }
}

export default App;
