import React, { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import { jsPDF } from 'jspdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// function to get an array of intern ids (just for logging purposes)
// input: dataset
const getInternIds = (data) => {
  const internIds = [];
  data.forEach((person) => {
    if (person.job_id === 'intern') {
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
  return data.filter((person) => person.job_id !== 'intern');
};

// Component for the org chart
const OrgChartComponent = () => {
  const chartRef = useRef(null); // Reference to the DOM element chartRef
  const chartInstance = useRef(null); // This reference holds the instance of the chart
  const [includeInterns, setIncludeInterns] = useState(true); // State to track whether interns should be included or not
  const [chartData, setChartData] = useState(null); // State to store the chart data
  const [searchTerm, setSearchTerm] = useState(''); // State to store the search term
  const [filteredData, setFilteredData] = useState(null); // State to store the filtered data
  const [departments, setDepartments] = useState([]); // State to store unique departments
  const [selectedDepartments, setSelectedDepartments] = useState([]); // State to store selected departments for highlighting
  const [expandedNodes, setExpandedNodes] = useState([]); // State to store expanded nodes
  const departmentColors = useRef({}); // Ref to store department colors

  // useEffect runs the fetchData function once the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.csv'); // Fetch the data from the provided URL
        const data = await response.text(); // Reads the response and converts it to text
        const parsedData = d3.csvParse(data); // Parse the data into the format expected by d3-org-chart
        setChartData(parsedData); // Set the chartData state to the parsedData

        // Extract unique departments and set them
        const uniqueDepartments = [...new Set(parsedData.map((d) => d.department))];
        setDepartments(uniqueDepartments); // Set the departments state to uniqueDepartments
        generateDepartmentColors(uniqueDepartments); // Generate colors for each department
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData(); // Call fetchData
  }, []);

  // Function to generate a unique color for each department and store it in the ref
  const generateDepartmentColors = (uniqueDepartments) => {
    const colors = ['#FFCE07', '#FF8C00', '#FF6347', '#40E0D0', '#2E8B57', '#9370DB', '#FF69B4', '#8A2BE2', '#A52A2A', '#5F9EA0'];
    uniqueDepartments.forEach((department, index) => {
      departmentColors.current[department] = colors[index % colors.length];
    });
  };

  // useEffect to filter data based on interns toggle
  useEffect(() => {
    if (chartData) {
      const data = filterData(chartData, includeInterns); // Filter the data based on whether includeInterns is true or false
      const updatedData = data.map((d) => ({
        ...d,
        _expanded: expandedNodes.includes(d.id),
        _highlighted: selectedDepartments.includes(d.department),
        _highlightColor: selectedDepartments.includes(d.department)
          ? getDepartmentColor(d.department)
          : null,
      }));
      setFilteredData(updatedData); // Update the filteredData state
    }
  }, [includeInterns, chartData, expandedNodes, selectedDepartments]); // Update when includeInterns, chartData, expandedNodes, or selectedDepartments change

  // useEffect to handle search term
  useEffect(() => {
    if (filteredData) {
      const data = filteredData.map((d) => ({
        ...d,
        _highlighted: searchTerm !== '' && d.name.toLowerCase().includes(searchTerm.toLowerCase()),
        _expanded: searchTerm !== '' && d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      }));
      if (chartInstance.current) {
        chartInstance.current.data(data).render().fit();
      }
    }
  }, [searchTerm, filteredData]); // Update when searchTerm or filteredData changes

  // Function to get a unique color for each department
  const getDepartmentColor = (department) => {
    return departmentColors.current[department] || '#000000';
  };

  // Rendering the org chart
  useEffect(() => {
    if (filteredData) {
      if (chartRef.current) {
        // checks if chartRef is attached to a DOM element
        if (chartInstance.current) {
          // checks if a chart instance already exists
          chartInstance.current.data(filteredData).render().fit(); // Update existing chart with new data, re-renders, and fits in container
        } else {
          // if no chart instance exists
          chartInstance.current = new OrgChart() // initialize new OrgChart instance
            .svgWidth(window.innerWidth / 4)
            .svgHeight(window.innerHeight)
            .nodeHeight((d) => 110)
            .nodeWidth((d) => 120)
            .childrenMargin((d) => 50) // made this smaller
            .compactMarginBetween((d) => 35)
            .compactMarginPair((d) => 30)
            .neighbourMargin((a, b) => 20)
            .nodeContent((d, i, arr, state) => {
              const color = d.data.job_id === 'intern' ? '#2D8D8F' : '#28282a'; // Different color for interns
              const imageDiffVert = 25;
              return `
                <div style='width:${d.width}px;height:${
                d.height
              }px;padding-top:${
                imageDiffVert - 2
              }px;padding-left:1px;padding-right:1px'>
                  <div style="font-family: 'Open Sans', sans-serif;background-color:${color};margin-left:-1px;width:${
                d.width - 2
              }px;height:${
                d.height - imageDiffVert
              }px;border-radius:10px;border: 2px solid #ed6622">
                    <div style="display:flex;justify-content:flex-end;margin-top:15px;margin-right:8px;color:white; font-weight:bold">
                      <a href="https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(
                        d.data.email
                      )}" target="_blank" style="color:white;margin-right:5px;">
                        <i class="fa-solid fa-comments"></i>
                      </a>
                      <a href="mailto:${
                        d.data.email
                      }" target="_blank" style="color:white;">
                        <i class="fas fa-envelope"></i>
                      </a>
                    </div>
                    <div style="background-color:#ed6622;margin-top:${
                      -imageDiffVert - 25
                    }px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
                    <div style="margin-top:${
                      -imageDiffVert - 22.5
                    }px;"><img src="${
                d.data.image
              }" style="margin-left:${17.5}px;border-radius:100px;width:45px;height:45px;" /></div>
                    <div style="font-size:15px;color:white; margin-top:3px; font-weight:bold; text-align: center;">${
                      d.data.name
                    }</div>
                    <div style="color:white; margin-top:1px;font-size:10px; font-weight:bold;line-height: 1.1; text-align: center;">${
                      d.data.position
                    }</div> <!-- Adjusted line-height -->
                  </div>
                </div>
              `;
            })
            .container(chartRef.current)
            .data(filteredData)
            .layout('bottom')
            .linkUpdate(function (d, i, arr) {
              d3.select(this)
                .attr('stroke', (d) =>
                  d.data._upToTheRootHighlighted ? '#E27396' : '#ed6622'
                )
                .attr('stroke-width', (d) =>
                  d.data._upToTheRootHighlighted ? 5 : 2
                );

              if (d.data._upToTheRootHighlighted) {
                d3.select(this).raise();
              }
            })
            .nodeUpdate(function (d, i, arr) {
              var nodeSelection = d3.select(this);
              nodeSelection
                .select('.node-rect')
                .attr('stroke', (d) =>
                  d.data._highlighted || d.data._upToTheRootHighlighted
                    ? d.data._highlightColor || '#FFCE07'
                    : 'none'
                )
                .attr(
                  'stroke-width',
                  d.data._highlighted || d.data._upToTheRootHighlighted ? 15 : 1
                )
                .attr('width', (d) => (d.data._highlighted ? 121 : d.width)) // Adjust width based on highlight state
                .attr('height', (d) => (d.data._highlighted ? 90 : d.height)) // Adjust height based on highlight state
                .attr('x', 0)
                .attr('y', 23);

              nodeSelection
                .select('.node-button-foreign-object')
                .attr('x', '10')
                .attr('y', '5');

              nodeSelection
                .select('.node-button-div > div')
                .style('background', '#ED6622')
                .style('stroke', 'black');

              nodeSelection
                .selectAll('.node-button-div > div > div > span')
                .style('color', 'black')
                .style('font-weight', 'bold');
              nodeSelection
                .select('.node-button-div > div > div > span > svg > path')
                .style('stroke', 'black')
                .style('fill', 'black');
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
        console.log('Image is loading...'); // Add console log here
        const pdf = new jsPDF('landscape'); // Specify landscape orientation
        const img = new Image();
        img.src = base64;
        img.onload = function () {
          console.log('Image loaded successfully.'); // Add console log here
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
      setExpandedNodes(filteredData.map((d) => d.id)); // Track all expanded nodes
    }
  };

  const handleCollapseAll = () => {
    if (chartInstance.current) {
      chartInstance.current.collapseAll().render().fit();
      setExpandedNodes([]); // Reset expanded nodes when collapsing all
    }
  };

  const handleDepartmentChange = (department) => {
    setSelectedDepartments((prev) => {
      if (prev.includes(department)) {
        // Department already selected, remove it
        return prev.filter((dep) => dep !== department);
      } else {
        // Department not selected, add it
        return [...prev, department];
      }
    });

    // Track expanded nodes
    const updatedExpandedNodes = filteredData
      .filter((d) => d.department === department || selectedDepartments.includes(d.department))
      .map((d) => d.id);
    setExpandedNodes((prev) => [...new Set([...prev, ...updatedExpandedNodes])]);

    // Expand nodes for the selected department
    if (chartInstance.current) {
      const updatedData = filteredData.map((d) => ({
        ...d,
        _expanded: updatedExpandedNodes.includes(d.id),
        _highlighted: selectedDepartments.includes(d.department),
        _highlightColor: selectedDepartments.includes(d.department)
          ? getDepartmentColor(d.department)
          : null,
      }));
      chartInstance.current.data(updatedData).render().fit();
    }
  };

  return (
    <div>
      <input
        type='checkbox'
        id='includeInterns'
        name='includeInterns'
        checked={includeInterns}
        onChange={() => setIncludeInterns(!includeInterns)} // Toggle the state when checkbox is changed
      />
      Include Interns
      <button onClick={downloadPdf}>Export PDF</button>
      <input
        type='search'
        id='searchByName'
        name='searchByName'
        placeholder='Search by name'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleExpandAll}>Expand All</button>
      <button onClick={handleCollapseAll}>Collapse All</button>
      <div>
        {departments.map((department) => (
          <div key={department}>
            <input
              type='checkbox'
              id={department}
              name={department}
              checked={selectedDepartments.includes(department)}
              onChange={() => handleDepartmentChange(department)}
            />
            {department}
          </div>
        ))}
      </div>
      <div className='chart-container' ref={chartRef}></div>
    </div>
  );
};

export default OrgChartComponent;
