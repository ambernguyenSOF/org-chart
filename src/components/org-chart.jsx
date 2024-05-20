import React, { useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3'; // Import d3 library
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const OrgChartComponent = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the data from the provided URL
        const response = await fetch(
          'https://raw.githubusercontent.com/bumbeishvili/sample-data/main/data-oracle.csv'
        );
        const data = await response.text();

        // Parse the data into the format expected by d3-org-chart
        const parsedData = d3.csvParse(data);

        // Render the organization chart
        if (chartRef.current) {
          chartInstance.current = new OrgChart()
            .svgWidth(window.innerWidth)   // Dynamically set svg width to the full viewport width
            .svgHeight(window.innerHeight)  // Dynamically set svg height to the full viewport height
            .nodeHeight((d) => 110) // 85 + 25
            .nodeWidth((d) => 222) // 220 + 2
            .childrenMargin((d) => 50)
            .compactMarginBetween((d) => 35)
            .compactMarginPair((d) => 30)
            .neighbourMargin((a, b) => 20)
            .nodeContent((d, i, arr, state) => {
              const color = '#FFFFFF';
              const imageDiffVert = 27; // 25 + 2
              return `
                <div style='width:${d.width}px;height:${d.height}px;padding-top:${imageDiffVert - 2}px;padding-left:1px;padding-right:1px'>
                  <div style="font-family: 'Inter', sans-serif;background-color:${color};  margin-left:-1px;width:${d.width - 2}px;height:${d.height - imageDiffVert}px;border-radius:10px;border: 1px solid #E4E2E9">
                    <div style="display:flex;justify-content:flex-end;margin-top:5px;margin-right:8px">#${d.data.id}</div>
                    <div style="background-color:${color};margin-top:${-imageDiffVert - 20}px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
                    <div style="margin-top:${-imageDiffVert - 20}px;"><img src="${d.data.image}" style="margin-left:${20}px;border-radius:100px;width:40px;height:40px;" /></div>
                    <div style="font-size:15px;color:#08011E;margin-left:20px;margin-top:10px">${d.data.name}</div>
                    <div style="color:#716E7B;margin-left:20px;margin-top:3px;font-size:10px;">${d.data.position}</div>
                  </div>
                </div>
              `;
            })
            .container(chartRef.current)
            .data(parsedData)
            .layout('bottom') // Set the layout to 'bottom'
            .render();

          // Dynamically adjust the height of the container
          chartInstance.current.fit();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const downloadPdf = () => {
    chartInstance.current.exportImg({
      save: false,
      full: true,
      onLoad: (base64) => {
        var pdf = new jsPDF();
        var img = new Image();
        img.src = base64;
        img.onload = function () {
          pdf.addImage(
            img,
            'JPEG',
            5,
            5,
            595 / 3,
            ((img.height / img.width) * 595) / 3
          );
          pdf.save('chart.pdf');
        };
      },
    });
  };

  return (
    <div>
      <button onClick={downloadPdf}>Export PDF</button>
      <div className="chart-container" ref={chartRef}></div>
    </div>
  );
};

export default OrgChartComponent;

