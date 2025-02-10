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
  onUpdatePeople
}) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const svgRef = useRef(null);

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
    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
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
    svg.append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", CENTER_RADIUS)
      .attr("fill", centerBgColor)
      .attr("stroke", "#333")
      .on("click", () => { setSelectedPersonId(centerPersonId); });
    
    console.log('Center color:', centerBgColor, 'Text color:', getTextColorForBackground(centerBgColor));
    
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY + 4)
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
        if (!personId) {
          svg.append("path")
            .attr("transform", `translate(${centerX},${centerY})`)
            .attr("d", arcGenerator)
            .attr("fill", "#eee")
            .attr("stroke", "#ccc");
          continue;
        }
        svg.append("path")
          .attr("transform", `translate(${centerX},${centerY})`)
          .attr("d", arcGenerator)
          .attr("fill", arcFillColor)
          .attr("stroke", "#333")
          .on("click", () => { setSelectedPersonId(personId); });
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
          svg.append("defs")
            .append("path")
            .attr("id", textPathId)
            .attr("transform", `translate(${centerX},${centerY})`)
            .attr("d", lineArcGen());
          const lineArcLength = angleDiff * lineRadius;
          svg.append("text")
            .style("font-size", DEFAULT_FONT_SIZE + "px")
            .style("fill", getTextColorForBackground(arcFillColor))
            .append("textPath")
            .attr("xlink:href", "#" + textPathId)
            .attr("startOffset", (lineArcLength / 2) + "px")
            .style("text-anchor", "middle")
            .text(lineText);
        });
      }
    }
  }

  const handleEditSave = (updatedPerson) => {
    onUpdatePeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );
    setSelectedPersonId(null);
  };

  const handleEditCancel = () => {
    setSelectedPersonId(null);
  };

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      {selectedPerson && (
        <PersonEditForm
          person={selectedPerson}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
