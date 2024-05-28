import React, { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import { jsPDF } from 'jspdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

const filterData = (data, includeInterns) => {
  if (includeInterns) return data;
  return data.filter((person) => person.job_id !== 'intern');
};

const OrgChartComponent = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [includeInterns, setIncludeInterns] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const departmentColors = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.csv');
        const data = await response.text();
        const parsedData = d3.csvParse(data);
        setChartData(parsedData);

        const uniqueDepartments = [...new Set(parsedData.map((d) => d.department))];
        setDepartments(uniqueDepartments);
        generateDepartmentColors(uniqueDepartments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const generateDepartmentColors = (uniqueDepartments) => {
    const colors = ['#FFCE07', '#FF8C00', '#FF6347', '#40E0D0', '#2E8B57', '#9370DB', '#FF69B4', '#8A2BE2', '#A52A2A', '#5F9EA0'];
    uniqueDepartments.forEach((department, index) => {
      departmentColors.current[department] = colors[index % colors.length];
    });
  };

  useEffect(() => {
    if (chartData) {
      const data = filterData(chartData, includeInterns);
      const updatedData = data.map((d) => ({
        ...d,
        _expanded: expandedNodes.includes(d.id),
        _highlighted: selectedDepartments.includes(d.department),
        _highlightColor: selectedDepartments.includes(d.department)
          ? getDepartmentColor(d.department)
          : null,
      }));
      setFilteredData(updatedData);
    }
  }, [includeInterns, chartData, expandedNodes, selectedDepartments]);

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
  }, [searchTerm, filteredData]);

  const getDepartmentColor = (department) => {
    return departmentColors.current[department] || '#000000';
  };

  useEffect(() => {
    if (filteredData) {
      if (chartRef.current) {
        if (chartInstance.current) {
          chartInstance.current.data(filteredData).render().fit();
        } else {
          chartInstance.current = new OrgChart()
            .svgWidth(window.innerWidth / 4)
            .svgHeight(window.innerHeight)
            .nodeHeight((d) => 110)
            .nodeWidth((d) => 120)
            .childrenMargin((d) => 50)
            .compactMarginBetween((d) => 35)
            .compactMarginPair((d) => 30)
            .neighbourMargin((a, b) => 20)
            .nodeContent((d, i, arr, state) => {
              const color = d.data.job_id === 'intern' ? '#2D8D8F' : '#28282a';
              const imageDiffVert = 25;
              return `
                <div style='width:${d.width}px;height:${d.height}px;padding-top:${imageDiffVert - 2}px;padding-left:1px;padding-right:1px'>
                  <div style="font-family: 'Open Sans', sans-serif;background-color:${color};margin-left:-1px;width:${d.width - 2}px;height:${d.height - imageDiffVert}px;border-radius:10px;border: 2px solid #ed6622">
                    <div style="display:flex;justify-content:flex-end;margin-top:15px;margin-right:8px;color:white; font-weight:bold">
                      <a href="https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(d.data.email)}" target="_blank" style="color:white;margin-right:5px;">
                        <i class="fa-solid fa-comments"></i>
                      </a>
                      <a href="mailto:${d.data.email}" target="_blank" style="color:white;">
                        <i class="fas fa-envelope"></i>
                      </a>
                    </div>
                    <div style="background-color:#ed6622;margin-top:${-imageDiffVert - 25}px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
                    <div style="margin-top:${-imageDiffVert - 22.5}px;"><img src="${d.data.image}" style="margin-left:${17.5}px;border-radius:100px;width:45px;height:45px;" /></div>
                    <div style="font-size:15px;color:white; margin-top:3px; font-weight:bold; text-align: center;">${d.data.name}</div>
                    <div style="color:white; margin-top:1px;font-size:10px; font-weight:bold;line-height: 1.1; text-align: center;">${d.data.position}</div>
                  </div>
                </div>
              `;
            })
            .container(chartRef.current)
            .data(filteredData)
            .layout('bottom')
            .linkUpdate(function (d, i, arr) {
              d3.select(this)
                .attr('stroke', (d) => d.data._upToTheRootHighlighted ? '#E27396' : '#ed6622')
                .attr('stroke-width', (d) => d.data._upToTheRootHighlighted ? 5 : 2);

              if (d.data._upToTheRootHighlighted) {
                d3.select(this).raise();
              }
            })
            .nodeUpdate(function (d, i, arr) {
              var nodeSelection = d3.select(this);
              nodeSelection
                .select('.node-rect')
                .attr('stroke', (d) => d.data._highlighted || d.data._upToTheRootHighlighted ? d.data._highlightColor || '#FFCE07' : 'none')
                .attr('stroke-width', d.data._highlighted || d.data._upToTheRootHighlighted ? 12 : 1)
                .attr('width', (d) => (d.data._highlighted ? 120 : d.width))
                .attr('height', (d) => (d.data._highlighted ? 87 : d.height))
                .attr('x', -1)
                .attr('y', 22);

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
  }, [filteredData]);

  const downloadPdf = () => {
    chartInstance.current.exportImg({
      save: false,
      full: true,
      onLoad: (base64) => {
        console.log('Image is loading...');
        const pdf = new jsPDF('landscape');
        const img = new Image();
        img.src = base64;
        img.onload = function () {
          console.log('Image loaded successfully.');
          const aspectRatio = img.height / img.width;
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = pageWidth - 10;
          const imgHeight = imgWidth * aspectRatio;

          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
          pdf.save('chart.pdf');
        };
      },
    });
  };

  const handleExpandAll = () => {
    if (chartInstance.current) {
      chartInstance.current.expandAll().render().fit();
      setExpandedNodes(filteredData.map((d) => d.id));
    }
  };

  const handleCollapseAll = () => {
    if (chartInstance.current) {
      chartInstance.current.collapseAll().render().fit();
      setExpandedNodes([]);
    }
  };

  const handleDepartmentChange = (department) => {
    setSelectedDepartments((prev) => {
      if (prev.includes(department)) {
        return prev.filter((dep) => dep !== department);
      } else {
        return [...prev, department];
      }
    });

    const updatedExpandedNodes = filteredData
      .filter((d) => d.department === department || selectedDepartments.includes(d.department))
      .map((d) => d.id);
    setExpandedNodes((prev) => [...new Set([...prev, ...updatedExpandedNodes])]);

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

  const handleSelectAll = () => {
    setSelectedDepartments(departments);
    setExpandedNodes(filteredData.map((d) => d.id));

    const updatedData = filteredData.map((d) => ({
      ...d,
      _expanded: true,
      _highlighted: departments.includes(d.department),
      _highlightColor: getDepartmentColor(d.department),
    }));
    if (chartInstance.current) {
      chartInstance.current.data(updatedData).render().fit();
    }
  };

  const handleDeselectAll = () => {
    setSelectedDepartments([]);

    const updatedData = filteredData.map((d) => ({
      ...d,
      _highlighted: false,
      _highlightColor: null,
    }));
    if (chartInstance.current) {
      chartInstance.current.data(updatedData).render().fit();
    }
  };

  return (
    <div style={{ background: "#D3D7D6" }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-2 my-4">
            <div className="mb-3">
              <input
                type="search"
                id="searchInterns"
                name="searchInterns"
                className="form-control"
                placeholder="Search for employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="checkbox"
                id="includeInterns"
                name="includeInterns"
                checked={includeInterns}
                onChange={() => setIncludeInterns(!includeInterns)}
              />
              <label htmlFor="includeInterns" className="ms-2">Include Interns</label>
            </div>
            <div className="mb-3">
              <button className="btn btn-secondary w-100" style={{ backgroundColor: "#ED6622", color: "#fff", border: "none", fontWeight: "bold"}} onClick={handleExpandAll}>Expand All</button>
            </div>
            <div className="mb-3">
              <button className="btn btn-secondary w-100" style={{ backgroundColor: "#ED6622", color: "#fff", border: "none", fontWeight: "bold"}} onClick={handleCollapseAll}>Collapse All</button>
            </div>
            <div className="accordion mb-3" id="accordionExample">
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingTwo">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                    Departments
                  </button>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                  <div className="accordion-body">
                    {departments.map((department) => (
                      <div key={department} className="form-check">
                        <input
                          type="checkbox"
                          id={department}
                          name={department}
                          className="form-check-input"
                          checked={selectedDepartments.includes(department)}
                          onChange={() => handleDepartmentChange(department)}
                          style={{
                            backgroundColor: selectedDepartments.includes(department) ? getDepartmentColor(department) : 'transparent',
                          }}
                        />
                        <label htmlFor={department} className="form-check-label">
                          {department}
                        </label>
                      </div>
                    ))}
                    <div className="mt-3">
                      <button className="btn btn-secondary w-100 mb-2" style={{ backgroundColor: "#ED6622", color: "#fff", border: "none", fontWeight: "bold"}} onClick={handleSelectAll}>Select All Departments</button>
                      <button className="btn btn-secondary w-100" style={{ backgroundColor: "#ED6622", color: "#fff", border: "none", fontWeight: "bold"}} onClick={handleDeselectAll}>Deselect All Departments</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <button className="btn btn-primary w-100" style={{ backgroundColor: "#ED6622", color: "#fff", border: "none", fontWeight: "bold"}} onClick={downloadPdf}>Export PDF</button>
            </div>
          </div>
          <div className="col-lg-10">
            <div className="chart-container" ref={chartRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgChartComponent;
