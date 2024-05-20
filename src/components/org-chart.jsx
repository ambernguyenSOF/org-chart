import React, { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

const filterData = (data, includeInterns) => {
  if (includeInterns) return data;
  return data.filter(person => person.job_id !== "intern");
};

const OrgChartComponent = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [includeInterns, setIncludeInterns] = useState(true); // State to track whether interns should be included or not
  const [chartData, setChartData] = useState(null); // State to store the chart data

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the data from the provided URL
        const response = await fetch('/data.csv');
        const data = await response.text();

        // Parse the data into the format expected by d3-org-chart
        const parsedData = d3.csvParse(data);

        setChartData(parsedData); // Store the parsed data in state

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chartData) {
      const internIds = getInternIds(chartData);
      const filteredData = filterData(chartData, includeInterns);

      // Render the organization chart
      if (chartRef.current) {
        if (chartInstance.current) {
          chartInstance.current.data(filteredData).render().fit(); // Update existing chart
        } else {
          chartInstance.current = new OrgChart()
            .svgWidth(window.innerWidth)
            .svgHeight(window.innerHeight)
            .nodeHeight((d) => 110)
            .nodeWidth((d) => 222)
            .childrenMargin((d) => 50)
            .compactMarginBetween((d) => 35)
            .compactMarginPair((d) => 30)
            .neighbourMargin((a, b) => 20)
            .nodeContent((d, i, arr, state) => {
              const color = '#FFFFFF';
              const imageDiffVert = 27;
              return `
                <div style='width:${d.width}px;height:${d.height}px;padding-top:${imageDiffVert - 2}px;padding-left:1px;padding-right:1px'>
                  <div style="font-family: 'Inter', sans-serif;background-color:${color};  margin-left:-1px;width:${d.width - 2}px;height:${d.height - imageDiffVert}px;border-radius:10px;border: 1px solid #E4E2E9">
                    <div style="display:flex;justify-content:flex-end;margin-top:5px;margin-right:8px">${d.data.job_id}</div>
                    <div style="background-color:${color};margin-top:${-imageDiffVert - 20}px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
                    <div style="margin-top:${-imageDiffVert - 20}px;"><img src="${d.data.image}" style="margin-left:${20}px;border-radius:100px;width:40px;height:40px;" /></div>
                    <div style="font-size:15px;color:#08011E;margin-left:20px;margin-top:10px">${d.data.name}</div>
                    <div style="color:#716E7B;margin-left:20px;margin-top:3px;font-size:10px;">${d.data.position}</div>
                  </div>
                </div>
              `;
            })
            .container(chartRef.current)
            .data(filteredData)
            .layout('bottom')
            .render();

          chartInstance.current.fit();
        }
      }
    }
  }, [includeInterns, chartData]); // Update chart when includeInterns or chartData changes

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
  

  return (
    <div>
      <input
        type="checkbox"
        checked={includeInterns}
        onChange={() => setIncludeInterns(!includeInterns)} // Toggle the state when checkbox is changed
      />
      Include Interns
      <button onClick={downloadPdf}>Export PDF</button>
      <div className="chart-container" ref={chartRef}></div>
    </div>
  );
};

export default OrgChartComponent;
