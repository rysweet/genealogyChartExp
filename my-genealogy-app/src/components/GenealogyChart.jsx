import React, { useState, useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import PersonEditForm from "./PersonEditForm";
import PersonTooltip from "./PersonTooltip";
import { useSelector } from 'react-redux';  // Add this import

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
  // Convert any color format to RGB values
  let color = d3.color(backgroundColor);
  if (!color) {
    console.error('Invalid color format:', backgroundColor);
    return '#000000';
  }

  // Calculate relative luminance using WCAG formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const rgb = [color.r, color.g, color.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  
  // Use WCAG contrast ratio threshold
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function calculateDescendantColor(baseColor, generation, totalGenerations) {
  const color = d3.color(baseColor);
  const targetColor = d3.color("#ffffff");  // Target color for furthest descendants
  const t = generation / (totalGenerations - 1);  // Calculate interpolation factor
  
  // Interpolate between the base color and target color
  return d3.interpolateRgb(color, targetColor)(t);
}

export default function GenealogyChart({
  people,
  maxGenerations,
  centerPersonId,
  onUpdatePeople,
  onSetCenter,
  onResetZoom,  // Add this prop
  colorOverrides = {},  // New prop for custom colors
  onColorChange,        // New prop for handling color changes
  onSelectPerson,  // Add this prop
  selectedPersonId,  // Add this prop
}) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);  // Create zoom function reference
  const width = 800;  // Move width/height to component level
  const height = 800;

  // Add this near the top with other hooks
  const settings = useSelector(state => state.settings);

  // Move colorScale creation to component level
  const [colorScale] = useState(() => createColorScale(maxGenerations));
  const [tooltip, setTooltip] = useState({ person: null, position: { x: 0, y: 0 } });
  const tooltipTimeoutRef = useRef(null);

  // Add highlight style constants
  const HIGHLIGHT_STROKE_WIDTH = 3;
  const HIGHLIGHT_STROKE_COLOR = '#ff9800';
  const DEFAULT_STROKE_WIDTH = 1;
  const DEFAULT_STROKE_COLOR = '#333';

  // Move buildAncestorArray to component scope so it's accessible everywhere
  const [ancestorArray, setAncestorArray] = useState([]);

  // Create zoom behavior and store it immediately
  const [zoom] = useState(() => {
    return d3.zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        if (gRef.current) {
          d3.select(gRef.current)
            .attr("transform", event.transform);
        }
      });
  });

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

    // Store zoom function for reset
    zoomRef.current = zoom;

    // Apply zoom to svg element
    svg.call(zoom); // Apply zoom behavior here
    svg.call(zoom.transform, d3.zoomIdentity);

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
  }, [width, height, zoom, onResetZoom]);

  // Setup zoom reset handler
  const handleZoomReset = useCallback(() => {
    console.log("GenealogyChart handleZoomReset called");
    if (!svgRef.current || !zoomRef.current) {
      console.log("Missing refs:", { svg: !svgRef.current, zoom: !zoomRef.current });
      return;
    }
    
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  // Store zoom reset handler
  useEffect(() => {
    console.log("Setting up zoom reset handler");
    onResetZoom(handleZoomReset);
  }, [onResetZoom, handleZoomReset]);

  useEffect(() => {
    drawChart();
  }, [people, maxGenerations, centerPersonId, colorOverrides, selectedPersonId, settings]); // Added selectedPersonId

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

// Update geometry constants for 8 generations
const CENTER_RADIUS = 25;  // Slightly smaller center
const BASE_RING_WIDTH = 25;  // Slightly thinner rings
const RING_WIDTH_INCREMENT = 10;  // Smaller increment between rings

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

  function getEffectiveGenerations(ancestors) {
    // Find the highest generation that has any people
    let effectiveGen = 0;
    for (let i = 0; i < ancestors.length; i++) {
      if (ancestors[i].some(pid => pid !== null)) {
        effectiveGen = i;
      }
    }
    // Return at least maxGenerations or the highest populated generation
    return Math.max(maxGenerations, effectiveGen + 1);
  }

  // Helper to get color for a person/generation
  function getColorForPerson(personId, generation) {
    // Check if this person has a color override
    if (colorOverrides[personId]) {
      return colorOverrides[personId];
    }

    // Look for descendants with color overrides
    const descendantWithColor = findNearestColoredDescendant(personId, people, colorOverrides);
    if (descendantWithColor) {
      const [descendantId, generations] = descendantWithColor;
      return calculateDescendantColor(colorOverrides[descendantId], generations, maxGenerations);
    }
    
    return colorScale(generation);
  }

  function findNearestColoredDescendant(personId, people, colorOverrides) {
    // Find all immediate descendants (people who have this person as a parent)
    const descendants = people.filter(p => 
      p.parents && p.parents.includes(personId)
    );

    let minGenerations = Infinity;
    let closestDescendantId = null;

    // Check each descendant and their descendants recursively
    function searchDescendants(currentId, depth = 0, visited = new Set()) {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      // If this descendant has a color and is closer than what we've found
      if (colorOverrides[currentId] && depth < minGenerations) {
        minGenerations = depth;
        closestDescendantId = currentId;
      }

      // Check this person's descendants
      const currentDescendants = people.filter(p => 
        p.parents && p.parents.includes(currentId)
      );

      for (const descendant of currentDescendants) {
        searchDescendants(descendant.id);
      }
    }

    // Start search from each immediate descendant
    for (const descendant of descendants) {
      searchDescendants(descendant.id);
    }

    return closestDescendantId ? [closestDescendantId, minGenerations] : null;
  }

  // Updated segment click handler to clear tooltip
  const handleSegmentClick = (event, personId) => {
    event.stopPropagation();
    onSelectPerson(personId);  // Just call the handler, don't manage state locally
    setTooltip({ person: null, position: { x: 0, y: 0 } });
  };

  // Add createSegmentPath function at component level
  function createSegmentPath(segmentGroup, arcGenerator, personId, segmentColor) {
    const person = people.find(p => p.id === personId);
    return segmentGroup.append("path")
      .attr("d", arcGenerator)
      .attr("fill", segmentColor)
      .attr("stroke", personId === selectedPersonId ? HIGHLIGHT_STROKE_COLOR : DEFAULT_STROKE_COLOR)
      .attr("stroke-width", personId === selectedPersonId ? HIGHLIGHT_STROKE_WIDTH : DEFAULT_STROKE_WIDTH)
      .attr("cursor", "pointer")
      .attr("data-segment-id", `segment-${personId}`) // Add data attribute
      .style("pointer-events", "all")
      .on("click", (event) => handleSegmentClick(event, personId))
      .on("mouseover", (event) => handleSegmentHover(event, person))
      .on("mousemove", (event) => {
        if (tooltip.person) {
          setTooltip(prev => ({
            ...prev,
            position: { x: event.clientX, y: event.clientY }
          }));
        }
      })
      .on("mouseout", handleSegmentLeave);
  }

  // Add center click handler
  const handleCenterClick = (event) => {
    event.stopPropagation();
    onSelectPerson(centerPersonId);  // Add this line
    setTooltip({ person: null, position: { x: 0, y: 0 } });
  };

  // Move ancestors calculation outside of drawChart
  const buildAncestorArray = () => {
    const ancestors = [];
    for (let i = 0; i < maxGenerations; i++) {
      ancestors[i] = new Array(2 ** i).fill(null);
    }
    ancestors[0][0] = centerPersonId;
    
    const peopleMap = new Map(people.map((p) => [p.id, p]));
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
    return ancestors;
  };

  // Add handler for empty segment clicks
  const handleEmptySegmentClick = (event, generation, position) => {
    event.stopPropagation();
    
    const parentPosition = Math.floor(position / 2);
    const parentGeneration = generation - 1;
    const parentId = ancestorArray[parentGeneration]?.[parentPosition];
    
    const newPerson = {
      id: `p${Date.now()}`,
      firstName: '',
      lastName: '',
      birthDate: '',
      deathDate: '',
      parents: parentId ? [parentId] : []
    };
    
    onUpdatePeople(prev => [...prev, newPerson]);
    onSelectPerson(newPerson.id);
  };

  function drawChart() {
    if (!gRef.current) return;
    const ancestors = buildAncestorArray();
    setAncestorArray(ancestors); // Store ancestors in state

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

    const peopleMap = new Map(people.map((p) => [p.id, p]));
    // Remove duplicate ancestors creation since we already have it from buildAncestorArray()

    // Get effective number of generations to display
    const effectiveGenerations = getEffectiveGenerations(ancestors);
    
    // Create color scale using effective generations
    const colorScale = createColorScale(effectiveGenerations);

    const centerPerson = peopleMap.get(centerPersonId);
    const centerBgColor = colorOverrides[centerPersonId] || colorScale(0);

    // Update center circle to handle highlighting
    chartGroup.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", CENTER_RADIUS)
      .attr("fill", centerBgColor)
      .attr("stroke", centerPersonId === selectedPersonId ? HIGHLIGHT_STROKE_COLOR : DEFAULT_STROKE_COLOR)
      .attr("stroke-width", centerPersonId === selectedPersonId ? HIGHLIGHT_STROKE_WIDTH : DEFAULT_STROKE_WIDTH)
      .attr("cursor", "pointer")
      .style("pointer-events", "all")
      .on("click", handleCenterClick);

    console.log('Center color:', centerBgColor, 'Text color:', getTextColorForBackground(centerBgColor));
    
    chartGroup.append("text")
      .attr("x", 0)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .style("font-size", DEFAULT_FONT_SIZE + "px")
      .style("fill", getTextColorForBackground(centerBgColor))
      .text(centerPerson ? centerPerson.firstName + " " + centerPerson.lastName : "Unknown");
    for (let i = 1; i < effectiveGenerations; i++) {
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
          // Simplify empty segment handling - just the clickable path
          chartGroup.append("g")
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", "#eee")
            .attr("stroke", "#ccc")
            .attr("cursor", "pointer")
            .style("pointer-events", "all")
            .on("click", (event) => handleEmptySegmentClick(event, i, k));

          continue;
        }

        const person = peopleMap.get(personId);
        const segmentColor = personId ? getColorForPerson(personId, i) : "#eee";
        const textColor = getTextColorForBackground(segmentColor);

        // Use the new createSegmentPath function
        createSegmentPath(segmentGroup, arcGenerator, personId, segmentColor);

        let label = "Unknown";
        if (person) {
          label = settings.showYearsLived 
            ? `${person.firstName} ${person.lastName} (${person.birthDate} - ${person.deathDate})`
            : `${person.firstName} ${person.lastName}`;
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
          
          // Calculate the arc length for this specific line
          const textArcLength = Math.abs(endAngle - startAngle) * lineRadius;
          
          // Add data attribute to the path in defs
          segmentGroup.append("defs")
            .append("path")
            .attr("id", textPathId)
            .attr("d", lineArcGen())
            .attr("data-associated-segment", `segment-${personId}`);

          // Add data attributes to the text element
          const textElement = segmentGroup.append("text")
            .style("font-size", DEFAULT_FONT_SIZE + "px")
            .style("fill", textColor)
            .style("pointer-events", "none")
            .attr("data-text-for-segment", `segment-${personId}`)
            .attr("data-text-line", idx);

          textElement.append("textPath")
            .attr("xlink:href", "#" + textPathId)
            .attr("startOffset", (textArcLength / 2) + "px")  // Use textArcLength instead of lineArcLength
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
        onSelectPerson(null); // Use the prop instead of direct state setter
      }
    };

    // Add click handler to the container div instead of SVG
    const container = document.querySelector('.genealogy-container');
    if (container) {
      container.addEventListener('click', handleBackgroundClick);
      return () => container.removeEventListener('click', handleBackgroundClick);
    }
  }, [onSelectPerson]); // Add onSelectPerson to dependencies

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
  
  // Get the actual current color of the selected segment
  const getSelectedSegmentColor = (personId) => {
    if (!personId) return null;
    const ancestors = buildAncestorArray();
    const generation = ancestors.findIndex(gen => gen.includes(personId));
    return colorOverrides[personId] || colorScale(generation >= 0 ? generation : 0);
  };

  const handleColorChange = (newColor) => {
    onColorChange(selectedPersonId, newColor);
  };

  // Add mouseover/mouseout handlers
  const handleSegmentHover = (event, person) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    // Set new timeout for showing tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({
        person,
        position: { x: event.clientX, y: event.clientY }
      });
    }, 500); // 500ms delay
  };

  const handleSegmentLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setTooltip({ person: null, position: { x: 0, y: 0 } });
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="genealogy-container" style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      {selectedPersonId && (
        <PersonEditForm
          person={people.find(p => p.id === selectedPersonId)}
          backgroundColor={getSelectedSegmentColor(selectedPersonId)}
          onColorChange={handleColorChange}
          onSave={(updatedPerson, isNew) => {
            onUpdatePeople(prev => {
              if (isNew) {
                return [...prev, updatedPerson];
              }
              return prev.map(p => p.id === updatedPerson.id ? updatedPerson : p);
            });
          }}
          onClose={() => onSelectPerson(null)}
          onSetCenter={onSetCenter}
          onSelectPerson={onSelectPerson}  // Add this prop
          allPeople={people}
        />
      )}
      <PersonTooltip 
        person={tooltip.person}
        position={tooltip.position}
      />
    </div>
  );
}
