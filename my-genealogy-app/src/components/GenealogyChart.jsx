import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import PersonEditForm from "./PersonEditForm";

// Geometry
const RING_WIDTH = 60;
const ARC_PADDING = 0;
const CENTER_RADIUS = 30;

// Text
const DEFAULT_FONT_SIZE = 8;
const LINE_SPACING = 10;

/**
 * Create a color scale from very dark green (#002200) to a lighter green (#99ff99).
 */
function createColorScale(maxGenerations) {
  return d3.scaleLinear()
    .domain([0, maxGenerations - 1])
    .range(["#002200", "#99ff99"]);
}

function getTextColorForBackground(backgroundColor) {
  let r, g, b;
  
  if (backgroundColor.startsWith('#')) {
    // Handle hex format
    r = parseInt(backgroundColor.slice(1, 3), 16);
    g = parseInt(backgroundColor.slice(3, 5), 16);
    b = parseInt(backgroundColor.slice(5, 7), 16);
  } else if (backgroundColor.startsWith('rgb')) {
    // Handle rgb format
    const matches = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (matches) {
      [, r, g, b] = matches.map(Number);
    } else {
      console.error('Invalid RGB format:', backgroundColor);
      return '#ffffff';
    }
  } else {
    console.error('Unsupported color format:', backgroundColor);
    return '#ffffff';
  }
  
  // Calculate brightness using W3C formula
  const brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
  console.log(`RGB: ${r},${g},${b}, Brightness: ${brightness}`);
  
  return brightness > 125 ? "#003300" : "#ffffff";
}

export default function GenealogyChart({
  people,
  maxGenerations,
  centerPersonId,
  onUpdatePeople,
  onSetCenter,
  onResetZoom  // Add this prop
}) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);  // Create zoom function reference
  const width = 800;  // Move width/height to component level
  const height = 800;

  useEffect(() => {
    if (!svgRef.current) return;

    // Create base SVG with proper selection
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width/2, -height/2, width, height]);

    // Create a group for zoom transforms
    const zoomGroup = svg.append("g")
      .attr("class", "zoom-group");

    // Store the zoomGroup reference for later use
    gRef.current = zoomGroup.node();

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        d3.select(gRef.current)
          .attr("transform", event.transform);
      });

    // Store zoom function for reset
    zoomRef.current = zoom;

    // Apply zoom to svg element
    svg.call(zoom)
      .call(zoom.transform, d3.zoomIdentity);

    // Prevent default wheel behavior
    const svgElement = svgRef.current;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    svgElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (svgElement) {
        svgElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [width, height]);

  // Export reset zoom function
  useEffect(() => {
    onResetZoom(() => {
      if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity);
      }
    });
  }, [onResetZoom]);

  useEffect(() => {
    drawChart();
  }, [people, maxGenerations, centerPersonId]);

  function approximateTextWidth(str, fontSize = DEFAULT_FONT_SIZE) {
    const avgCharWidth = fontSize * 0.6;
    return str.length * avgCharWidth;
  }

  function wrapTextToWidth(str, arcLength, fontSize = DEFAULT_FONT_SIZE) {
    const words = str.split(" ");
    const lines = [];
    let currentLineWords = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = [...currentLineWords, words[i]].join(" ");
      const testWidth = approximateTextWidth(testLine, fontSize);
      if (testWidth <= arcLength) {
        currentLineWords.push(words[i]);
      } else {
        lines.push(currentLineWords.join(" "));
        currentLineWords = [words[i]];
      }
    }
    if (currentLineWords.length > 0) {
      lines.push(currentLineWords.join(" "));
    }
    return lines;
  }

// Update geometry constants
const CENTER_RADIUS = 30;
const BASE_RING_WIDTH = 30;  // Width for second generation
const RING_WIDTH_INCREMENT = 15;  // Amount to add for each generation
const ARC_PADDING = 0;

// Calculate ring width for a given generation
function getRingWidth(generation) {
  if (generation === 0) return CENTER_RADIUS;
  return BASE_RING_WIDTH + (generation - 1) * RING_WIDTH_INCREMENT;
}

// Calculate inner radius for a given generation
function getInnerRadius(generation) {
  if (generation === 0) return 0;
  if (generation === 1) return CENTER_RADIUS;
  
  // For generation > 1, sum up all previous ring widths
  return [...Array(generation - 1)]
    .reduce((sum, _, idx) => sum + getRingWidth(idx + 1), CENTER_RADIUS);
}

  function drawChart() {
    if (!gRef.current) return;

    // Use d3.select on the DOM node reference
    const zoomGroup = d3.select(gRef.current);
    zoomGroup.selectAll("*").remove();

    // Create chart group inside zoom group
    const chartGroup = zoomGroup.append("g");

    // Create a group for controls that won't be affected by zoom transforms
    const controlsGroup = zoomGroup.append("g")
      .attr("class", "controls")
      .attr("transform", `translate(${width/2 - 60}, ${-height/2 + 20})`);

    // Add zoom controls
    controlsGroup.append("rect")
      .attr("width", 50)
      .attr("height", 60)
      .attr("rx", 4)
      .attr("fill", "rgba(255, 255, 255, 0.8)")
      .attr("stroke", "#ccc");

    // Zoom in button
    controlsGroup.append("rect")
      .attr("x", 5)
      .attr("y", 5)
      .attr("width", 40)
      .attr("height", 24)
      .attr("rx", 4)
      .attr("fill", "white")
      .attr("stroke", "#ccc")
      .attr("cursor", "pointer")
      .on("click", handleZoomIn);

    controlsGroup.append("text")
      .attr("x", 25)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .style("font-size", "16px")
      .style("pointer-events", "none")
      .text("+");

    // Zoom out button
    controlsGroup.append("rect")
      .attr("x", 5)
      .attr("y", 31)
      .attr("width", 40)
      .attr("height", 24)
      .attr("rx", 4)
      .attr("fill", "white")
      .attr("stroke", "#ccc")
      .attr("cursor", "pointer")
      .on("click", handleZoomOut);

    controlsGroup.append("text")
      .attr("x", 25)
      .attr("y", 48)
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .style("font-size", "16px")
      .style("pointer-events", "none")
      .text("−");

    const colorScale = createColorScale(maxGenerations);
    const peopleMap = new Map(people.map((p) => [p.id, p]));
    const ancestors = [];
    for (let i = 0; i < maxGenerations; i++) {
      ancestors[i] = new Array(2 ** i).fill(null);
    }
    ancestors[0][0] = centerPersonId;
    for (let i = 0; i < maxGenerations - 1; i++) {
      const size = 2 ** i;
      for (let j = 0; j < size; j++) {
        const pid = ancestors[i][j];
        if (!pid) continue;
        const person = peopleMap.get(pid);
        if (!person) continue;
        if (person.parents && person.parents.length > 0) {
          ancestors[i + 1][2 * j] = person.parents[0] || null;
        }
        if (person.parents && person.parents.length > 1) {
          ancestors[i + 1][2 * j + 1] = person.parents[1] || null;
        }
      }
    }
    const centerPerson = peopleMap.get(centerPersonId);
    const centerBgColor = colorScale(0);

    // Use existing chartGroup instead of creating a new one
    chartGroup.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", CENTER_RADIUS)
      .attr("fill", centerBgColor)
      .attr("stroke", "#333")
      .attr("cursor", "pointer")
      .style("pointer-events", "all")
      .on("click", (event) => { 
        event.stopPropagation();
        setSelectedPersonId(centerPersonId);
      });
    
    console.log('Center color:', centerBgColor, 'Text color:', getTextColorForBackground(centerBgColor));
    
    chartGroup.append("text")
      .attr("x", 0)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .style("font-size", DEFAULT_FONT_SIZE + "px")
      .style("fill", getTextColorForBackground(centerBgColor))
      .text(centerPerson ? centerPerson.firstName + " " + centerPerson.lastName : "Unknown");
    for (let i = 1; i < maxGenerations; i++) {
      const genArray = ancestors[i];
      const segmentCount = 2 ** i;
      const arcAngle = (2 * Math.PI) / segmentCount - (ARC_PADDING * Math.PI) / 180;
      const ringWidth = getRingWidth(i);
      const innerRadius = getInnerRadius(i);
      const outerRadius = innerRadius + ringWidth;
      const arcFillColor = colorScale(i);
      for (let k = 0; k < segmentCount; k++) {
        const personId = genArray[k];
        const startAngle = k * ((2 * Math.PI) / segmentCount);
        const endAngle = startAngle + arcAngle;
        const arcGenerator = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(startAngle)
          .endAngle(endAngle);

        // Create segment group for better event handling
        const segmentGroup = chartGroup.append("g");

        if (!personId) {
          segmentGroup.append("path")
            .attr("d", arcGenerator)
            .attr("fill", "#eee")
            .attr("stroke", "#ccc");
          continue;
        }

        // Add clickable arc with improved handling
        segmentGroup.append("path")
          .attr("d", arcGenerator)
          .attr("fill", arcFillColor)
          .attr("stroke", "#333")
          .attr("cursor", "pointer")
          .style("pointer-events", "all")
          .on("click", (event) => {
            event.stopPropagation();
            setSelectedPersonId(personId);
          });

        let label = "Unknown";
        const person = peopleMap.get(personId);
        if (person) {
          label = person.firstName + " " + person.lastName + " (" + person.birthDate + " - " + person.deathDate + ")";
        }
        const midRadius = (innerRadius + outerRadius) / 2;
        const angleDiff = Math.abs(endAngle - startAngle);
        const arcLength = angleDiff * midRadius;
        const lines = wrapTextToWidth(label, arcLength, DEFAULT_FONT_SIZE);
        const numLines = lines.length;
        const totalHeight = (numLines - 1) * LINE_SPACING;
        // Now, line 0 will be the outermost line and subsequent lines are placed inward
        const outermostRadius = midRadius + totalHeight / 2;
        lines.forEach((lineText, idx) => {
          const lineRadius = outermostRadius - idx * LINE_SPACING;
          const lineArcGen = d3.arc()
            .innerRadius(lineRadius)
            .outerRadius(lineRadius)
            .startAngle(startAngle)
            .endAngle(endAngle);
          const textPathId = `textPath-${i}-${k}-line${idx}`;
          segmentGroup.append("defs")
            .append("path")
            .attr("id", textPathId)
            .attr("d", lineArcGen());
          const lineArcLength = angleDiff * lineRadius;
          segmentGroup.append("text")
            .style("font-size", DEFAULT_FONT_SIZE + "px")
            .style("fill", getTextColorForBackground(arcFillColor))
            .style("pointer-events", "none") // Make text non-blocking
            .append("textPath")
            .attr("xlink:href", "#" + textPathId)
            .attr("startOffset", (lineArcLength / 2) + "px")
            .style("text-anchor", "middle")
            .text(lineText);
        });
      }
    }
  }

  // Remove the SVG background click handler
  useEffect(() => {
    const handleBackgroundClick = (e) => {
      // Only close if clicking directly on the container div
      if (e.target === e.currentTarget) {
        setSelectedPersonId(null);
      }
    };

    // Add click handler to the container div instead of SVG
    const container = document.querySelector('.genealogy-container');
    if (container) {
      container.addEventListener('click', handleBackgroundClick);
      return () => container.removeEventListener('click', handleBackgroundClick);
    }
  }, []);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      const currentTransform = d3.zoomTransform(svgRef.current);
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(
          zoomRef.current.transform,
          currentTransform.scale(1.2)
        );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      const currentTransform = d3.zoomTransform(svgRef.current);
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(
          zoomRef.current.transform,
          currentTransform.scale(0.8)
        );
    }
  };

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  return (
    <div className="genealogy-container" style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      {selectedPerson && (
        <PersonEditForm
          person={selectedPerson}
          onSave={(updatedPerson, isNew) => {
            onUpdatePeople(prev => {
              if (isNew) {
                return [...prev, updatedPerson];
              }
              return prev.map(p => p.id === updatedPerson.id ? updatedPerson : p);
            });
          }}
          onClose={() => setSelectedPersonId(null)}
          onSetCenter={(id) => {
            onSetCenter(id);
            setSelectedPersonId(null);
          }}
          allPeople={people}
        />
      )}
    </div>
  );
}
