import React, { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import { jsPDF } from 'jspdf';

// function to get an array of intern ids (just for logging purposes)
// input: dataset
const getInternIds = (data) => {
  const internIds = [];
  data.forEach((person) => {
    if (person.job_id === "intern") {
      internIds.push(person.id);
    }
  });
  console.log(internIds);
  return internIds;
};

// function for filtering out interns from the dataset
// input: dataset
// input: includeInterns (state)
// if includeInterns is true, return all the data. if includeInterns is false, only keep people who's job_id is not intern
const filterData = (data, includeInterns) => {
  if (includeInterns) return data;
  return data.filter(person => person.job_id !== "intern");
};


// Component for the org chart
const OrgChartComponent = () => {
  const chartRef = useRef(null); // Reference to the DOM element chartRef
  const chartInstance = useRef(null); // This reference holds the instance of the chart
  const [includeInterns, setIncludeInterns] = useState(true); // State to track whether interns should be included or not
  const [chartData, setChartData] = useState(null); // State to store the chart data
  const [searchTerm, setSearchTerm] = useState(''); // State to store the search term
  const [filteredData, setFilteredData] = useState(null); // State to store the filtered data

  // useEffect runs the fetchData function once the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.csv'); // Fetch the data from the provided URL
        const data = await response.text(); // reads the response and converts it to text
        const parsedData = d3.csvParse(data); // Parse the data into the format expected by d3-org-chart
        setChartData(parsedData); // set the chartData state to the parsedData
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData(); // call fetchData
  }, []);

  // useEffect to filter data based on interns toggle
  useEffect(() => {
    if (chartData) {
      const data = filterData(chartData, includeInterns); // Filter the data based on whether includeInterns is true or false
      setFilteredData(data); // Update the filteredData state
    }
  }, [includeInterns, chartData]); // Update when includeInterns or chartData changes

  // useEffect to handle search term
  useEffect(() => {
    if (filteredData) {
      const data = filteredData.map(d => ({
        ...d,
        _highlighted: searchTerm !== '' && d.name.toLowerCase().includes(searchTerm.toLowerCase()),
        _expanded: searchTerm !== '' && d.name.toLowerCase().includes(searchTerm.toLowerCase())
      }));
      if (chartInstance.current) {
        chartInstance.current.data(data).render().fit();
      }
    }
  }, [searchTerm, filteredData]); // Update when searchTerm or filteredData changes

  // Rendering the org chart
  useEffect(() => {
    if (filteredData) {
      if (chartRef.current) { // checks if chartRef is attached to a DOM element
        if (chartInstance.current) { // checks if a chart instance already exists
          chartInstance.current.data(filteredData).render().fit(); // Update existing chart with new data, re-renders, and fits in container
        } else { // if no chart instance exists
          chartInstance.current = new OrgChart() // initialize new OrgChart instance
            .svgWidth(window.innerWidth)
            .svgHeight(window.innerHeight)
            .nodeHeight((d) => 110)
            .nodeWidth((d) => 222)
            .childrenMargin((d) => 50)
            .compactMarginBetween((d) => 35)
            .compactMarginPair((d) => 30)
            .neighbourMargin((a, b) => 20)
            .buttonContent(({ node, state }) => {
              const icons = {
                  "left": d => d ?
                      `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.283 3.50094L6.51 11.4749C6.37348 11.615 6.29707 11.8029 6.29707 11.9984C6.29707 12.194 6.37348 12.3819 6.51 12.5219L14.283 20.4989C14.3466 20.5643 14.4226 20.6162 14.5066 20.6516C14.5906 20.6871 14.6808 20.7053 14.772 20.7053C14.8632 20.7053 14.9534 20.6871 15.0374 20.6516C15.1214 20.6162 15.1974 20.5643 15.261 20.4989C15.3918 20.365 15.4651 20.1852 15.4651 19.9979C15.4651 19.8107 15.3918 19.6309 15.261 19.4969L7.9515 11.9984L15.261 4.50144C15.3914 4.36756 15.4643 4.18807 15.4643 4.00119C15.4643 3.81431 15.3914 3.63482 15.261 3.50094C15.1974 3.43563 15.1214 3.38371 15.0374 3.34827C14.9534 3.31282 14.8632 3.29456 14.772 3.29456C14.6808 3.29456 14.5906 3.31282 14.5066 3.34827C14.4226 3.38371 14.3466 3.43563 14.283 3.50094V3.50094Z" fill="#ED6622" stroke="#716E7B"/>
                    </svg></span><span style="color:#716E7B">${node.data._directSubordinatesPaging} </span></div>` :
                      `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.989 3.49944C7.85817 3.63339 7.78492 3.8132 7.78492 4.00044C7.78492 4.18768 7.85817 4.36749 7.989 4.50144L15.2985 11.9999L7.989 19.4969C7.85817 19.6309 7.78492 19.8107 7.78492 19.9979C7.78492 20.1852 7.85817 20.365 7.989 20.4989C8.05259 20.5643 8.12863 20.6162 8.21261 20.6516C8.2966 20.6871 8.38684 20.7053 8.478 20.7053C8.56916 20.7053 8.6594 20.6871 8.74338 20.6516C8.82737 20.6162 8.90341 20.5643 8.967 20.4989L16.74 12.5234C16.8765 12.3834 16.9529 12.1955 16.9529 11.9999C16.9529 11.8044 16.8765 11.6165 16.74 11.4764L8.967 3.50094C8.90341 3.43563 8.82737 3.38371 8.74338 3.34827C8.6594 3.31282 8.56916 3.29456 8.478 3.29456C8.38684 3.29456 8.2966 3.31282 8.21261 3.34827C8.12863 3.38371 8.05259 3.43563 7.989 3.50094V3.49944Z" fill="#ED6622" stroke="#716E7B"/>
                        </svg></span><span style="color:#716E7B">${node.data._directSubordinatesPaging} </span></div>`
                  ,
                  "bottom": d => d ? `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M19.497 7.98903L12 15.297L4.503 7.98903C4.36905 7.85819 4.18924 7.78495 4.002 7.78495C3.81476 7.78495 3.63495 7.85819 3.501 7.98903C3.43614 8.05257 3.38462 8.12842 3.34944 8.21213C3.31427 8.29584 3.29615 8.38573 3.29615 8.47653C3.29615 8.56733 3.31427 8.65721 3.34944 8.74092C3.38462 8.82463 3.43614 8.90048 3.501 8.96403L11.4765 16.74C11.6166 16.8765 11.8044 16.953 12 16.953C12.1956 16.953 12.3834 16.8765 12.5235 16.74L20.499 8.96553C20.5643 8.90193 20.6162 8.8259 20.6517 8.74191C20.6871 8.65792 20.7054 8.56769 20.7054 8.47653C20.7054 8.38537 20.6871 8.29513 20.6517 8.21114C20.6162 8.12715 20.5643 8.05112 20.499 7.98753C20.3651 7.85669 20.1852 7.78345 19.998 7.78345C19.8108 7.78345 19.6309 7.85669 19.497 7.98753V7.98903Z" fill="#ED6622" stroke="#716E7B"/>
                     </svg></span><span style="margin-left:1px;color:#716E7B" >${node.data._directSubordinatesPaging} </span></div>
                     ` : `<div style="display:flex;"><span style=" align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path d="M11.457 8.07005L3.49199 16.4296C3.35903 16.569 3.28485 16.7543 3.28485 16.9471C3.28485 17.1398 3.35903 17.3251 3.49199 17.4646L3.50099 17.4736C3.56545 17.5414 3.64304 17.5954 3.72904 17.6324C3.81504 17.6693 3.90765 17.6883 4.00124 17.6883C4.09483 17.6883 4.18745 17.6693 4.27344 17.6324C4.35944 17.5954 4.43703 17.5414 4.50149 17.4736L12.0015 9.60155L19.4985 17.4736C19.563 17.5414 19.6405 17.5954 19.7265 17.6324C19.8125 17.6693 19.9052 17.6883 19.9987 17.6883C20.0923 17.6883 20.1849 17.6693 20.2709 17.6324C20.3569 17.5954 20.4345 17.5414 20.499 17.4736L20.508 17.4646C20.641 17.3251 20.7151 17.1398 20.7151 16.9471C20.7151 16.7543 20.641 16.569 20.508 16.4296L12.543 8.07005C12.4729 7.99653 12.3887 7.93801 12.2954 7.89801C12.202 7.85802 12.1015 7.8374 12 7.8374C11.8984 7.8374 11.798 7.85802 11.7046 7.89801C11.6113 7.93801 11.527 7.99653 11.457 8.07005Z" fill="#ED6622" stroke="#716E7B"/>
                     </svg></span><span style="margin-left:1px;color:#716E7B" >${node.data._directSubordinatesPaging} </span></div>
                  `,
                  "right": d => d ? `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M7.989 3.49944C7.85817 3.63339 7.78492 3.8132 7.78492 4.00044C7.78492 4.18768 7.85817 4.36749 7.989 4.50144L15.2985 11.9999L7.989 19.4969C7.85817 19.6309 7.78492 19.8107 7.78492 19.9979C7.78492 20.1852 7.85817 20.365 7.989 20.4989C8.05259 20.5643 8.12863 20.6162 8.21261 20.6516C8.2966 20.6871 8.38684 20.7053 8.478 20.7053C8.56916 20.7053 8.6594 20.6871 8.74338 20.6516C8.82737 20.6162 8.90341 20.5643 8.967 20.4989L16.74 12.5234C16.8765 12.3834 16.9529 12.1955 16.9529 11.9999C16.9529 11.8044 16.8765 11.6165 16.74 11.4764L8.967 3.50094C8.90341 3.43563 8.82737 3.38371 8.74338 3.34827C8.6594 3.31282 8.56916 3.29456 8.478 3.29456C8.38684 3.29456 8.2966 3.31282 8.21261 3.34827C8.12863 3.38371 8.05259 3.43563 7.989 3.50094V3.49944Z" fill="#ED6622" stroke="#716E7B"/>
                     </svg></span><span style="color:#716E7B">${node.data._directSubordinatesPaging} </span></div>` :
                      `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M14.283 3.50094L6.51 11.4749C6.37348 11.615 6.29707 11.8029 6.29707 11.9984C6.29707 12.194 6.37348 12.3819 6.51 12.5219L14.283 20.4989C14.3466 20.5643 14.4226 20.6162 14.5066 20.6516C14.5906 20.6871 14.6808 20.7053 14.772 20.7053C14.8632 20.7053 14.9534 20.6871 15.0374 20.6516C15.1214 20.6162 15.1974 20.5643 15.261 20.4989C15.3918 20.365 15.4651 20.1852 15.4651 19.9979C15.4651 19.8107 15.3918 19.6309 15.261 19.4969L7.9515 11.9984L15.261 4.50144C15.3914 4.36756 15.4643 4.18807 15.4643 4.00119C15.4643 3.81431 15.3914 3.63482 15.261 3.50094C15.1974 3.43563 15.1214 3.38371 15.0374 3.34827C14.9534 3.31282 14.8632 3.29456 14.772 3.29456C14.6808 3.29456 14.5906 3.31282 14.5066 3.34827C14.4226 3.38371 14.3466 3.43563 14.283 3.50094V3.50094Z" fill="#ED6622" stroke="#716E7B"/>
                     </svg></span><span style="color:#716E7B">${node.data._directSubordinatesPaging} </span></div>`,
                  "top": d => d ? `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.457 8.07005L3.49199 16.4296C3.35903 16.569 3.28485 16.7543 3.28485 16.9471C3.28485 17.1398 3.35903 17.3251 3.49199 17.4646L3.50099 17.4736C3.56545 17.5414 3.64304 17.5954 3.72904 17.6324C3.81504 17.6693 3.90765 17.6883 4.00124 17.6883C4.09483 17.6883 4.18745 17.6693 4.27344 17.6324C4.35944 17.5954 4.43703 17.5414 4.50149 17.4736L12.0015 9.60155L19.4985 17.4736C19.563 17.5414 19.6405 17.5954 19.7265 17.6324C19.8125 17.6693 19.9052 17.6883 19.9987 17.6883C20.0923 17.6883 20.1849 17.6693 20.2709 17.6324C20.3569 17.5954 20.4345 17.5414 20.499 17.4736L20.508 17.4646C20.641 17.3251 20.7151 17.1398 20.7151 16.9471C20.7151 16.7543 20.641 16.569 20.508 16.4296L12.543 8.07005C12.4729 7.99653 12.3887 7.93801 12.2954 7.89801C12.202 7.85802 12.1015 7.8374 12 7.8374C11.8984 7.8374 11.798 7.85802 11.7046 7.89801C11.6113 7.93801 11.527 7.99653 11.457 8.07005Z" fill="#ED6622" stroke="#716E7B"/>
                      </svg></span><span style="margin-left:1px;color:#716E7B">${node.data._directSubordinatesPaging} </span></div>
                      ` : `<div style="display:flex;"><span style="align-items:center;display:flex;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.497 7.98903L12 15.297L4.503 7.98903C4.36905 7.85819 4.18924 7.78495 4.002 7.78495C3.81476 7.78495 3.63495 7.85819 3.501 7.98903C3.43614 8.05257 3.38462 8.12842 3.34944 8.21213C3.31427 8.29584 3.29615 8.38573 3.29615 8.47653C3.29615 8.56733 3.31427 8.65721 3.34944 8.74092C3.38462 8.82463 3.43614 8.90048 3.501 8.96403L11.4765 16.74C11.6166 16.8765 11.8044 16.953 12 16.953C12.1956 16.953 12.3834 16.8765 12.5235 16.74L20.499 8.96553C20.5643 8.90193 20.6162 8.8259 20.6517 8.74191C20.6871 8.65792 20.7054 8.56769 20.7054 8.47653C20.7054 8.38537 20.6871 8.29513 20.6517 8.21114C20.6162 8.12715 20.5643 8.05112 20.499 7.98753C20.3651 7.85669 20.1852 7.78345 19.998 7.78345C19.8108 7.78345 19.6309 7.85669 19.497 7.98753V7.98903Z" fill="#" stroke="#716E7B"/>
                      </svg></span><span style="margin-left:1px;color:#716E7B">${node.data._directSubordinatesPaging} </span></div>
                  `,
              }
              return `<div style="border:1px solid #E4E2E9;border-radius:3px;padding:3px;font-size:9px;margin:auto auto;background-color:white"> ${icons[state.layout](node.children)}  </div>`
            })
            .nodeContent((d, i, arr, state) => {
              const color = d.data.job_id === 'intern' ? '#2D8D8F' : '#28282a'; // Different color for interns
              const imageDiffVert = 25;
              return `
                <div style='width:${d.width}px;height:${d.height}px;padding-top:${imageDiffVert - 2}px;padding-left:1px;padding-right:1px'>
                  <div style="font-family: 'Open Sans', sans-serif;background-color:${color};margin-left:-1px;width:${d.width - 2}px;height:${d.height - imageDiffVert}px;border-radius:10px;border: 2px solid #ed6622">
                    <div style="display:flex;justify-content:flex-end;margin-top:5px;margin-right:8px;color:white; font-weight:bold">${d.data.job_id}</div>
                    <div style="background-color:#ed6622;margin-top:${-imageDiffVert - 15}px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
                    <div style="margin-top:${-imageDiffVert - 22.5}px;"><img src="${d.data.image}" style="margin-left:${17.5}px;border-radius:100px;width:45px;height:45px;" /></div>
                    <div style="font-size:15px;color:white;margin-left:20px;margin-top:3px; font-weight:bold">${d.data.name}</div>
                    <div style="color:white;margin-left:20px;margin-top:1.5px;font-size:10px; font-weight:bold">${d.data.position}</div>
                  </div>
                </div>
              `;
            })
            .container(chartRef.current)
            .data(filteredData)
            .layout('bottom')
            .linkUpdate(function (d, i, arr) {
              d3.select(this)
                .attr('stroke', d => d.data._upToTheRootHighlighted ? '#E27396' : '#ed6622')
                .attr('stroke-width', d => d.data._upToTheRootHighlighted ? 5 : 2);

              if (d.data._upToTheRootHighlighted) {
                d3.select(this).raise();
              }
            })
            .nodeUpdate(function (d, i, arr) {
              d3.select(this)
                .select('.node-rect')
                .attr("stroke", d => d.data._highlighted || d.data._upToTheRootHighlighted ? '#FFCE07' : 'none')
                .attr("stroke-width", d.data._highlighted || d.data._upToTheRootHighlighted ? 15 : 1)
                .attr("width", d => d.data._highlighted ? 224 : d.width)  // Adjust width based on highlight state
                .attr("height", d => d.data._highlighted ? 90 : d.height)  // Adjust height based on highlight state
                .attr("x", 0)
                .attr("y", 23);
            })
            .nodeUpdate(function (d, i, arr) {
              var nodeSelection = d3.select(this);
              
              nodeSelection.select('.node-button-div > div')
                  .style('background', '#ED6622')
                  .style('stroke', 'black');
              
              nodeSelection.selectAll('.node-button-div > div > div > span')
                  .style('color', 'black')
                  .style('font-weight', 'bold');

              nodeSelection.select('.node-button-div > div > div > span > svg > path')
                  .style('stroke', 'black')
                  .style('fill', 'black')
          })
          
            .render();

          chartInstance.current.fit();
        }
      }
    }
  }, [filteredData]); // Update chart when filteredData changes

  const downloadPdf = () => {
    chartInstance.current.exportImg({
      save: false,
      full: true,
      onLoad: (base64) => {
        const pdf = new jsPDF('landscape'); // Specify landscape orientation
        const img = new Image();
        img.src = base64;
        img.onload = function () {
          const aspectRatio = img.height / img.width;
          const imgWidth = 300; // Width of A4 page in mm
          const imgHeight = imgWidth * aspectRatio;
          pdf.addImage(img, 'JPEG', 5, 5, imgWidth, imgHeight); // Adjust x, y, width, height as needed
          pdf.save('chart.pdf');
        };
      },
    });
  };

  const handleExpandAll = () => {
    if (chartInstance.current) {
      chartInstance.current.expandAll().render().fit();
    }
  };

  const handleCollapseAll = () => {
    if (chartInstance.current) {
      chartInstance.current.collapseAll().render().fit();
    }
  };

  return (
    <div>
      <input
        type="checkbox"
        checked={includeInterns}
        onChange={() => setIncludeInterns(!includeInterns)} // Toggle the state when checkbox is changed
      />
      Include Interns
      <button onClick={downloadPdf}>Export PDF</button>
      <input
        type="search"
        placeholder="Search by name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleExpandAll}>Expand All</button>
      <button onClick={handleCollapseAll}>Collapse All</button>
      <div className="chart-container" ref={chartRef}></div>
    </div>
  );
};

export default OrgChartComponent;
