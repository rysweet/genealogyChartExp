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

export default function GenealogyChart({
  people,
  maxGenerations,
  centerPersonId,
  onUpdatePeople
}) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!people || people.length === 0) return;
    drawChart();
  }, [people, maxGenerations]);

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
    svg.append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", CENTER_RADIUS)
      .attr("fill", colorScale(0))
      .attr("stroke", "#333")
      .on("click", () => { setSelectedPersonId(centerPersonId); });
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY + 4)
      .attr("text-anchor", "middle")
      .style("font-size", DEFAULT_FONT_SIZE + "px")
      .style("fill", "#fff")
      .text(centerPerson ? centerPerson.firstName + " " + centerPerson.lastName : "Unknown");
    for (let i = 1; i < maxGenerations; i++) {
      const genArray = ancestors[i];
      const segmentCount = 2 ** i;
      const arcAngle = (2 * Math.PI) / segmentCount - (ARC_PADDING * Math.PI) / 180;
      const innerRadius = (i - 1) * RING_WIDTH + CENTER_RADIUS;
      const outerRadius = i * RING_WIDTH + CENTER_RADIUS;
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
            .attr("transform", \`translate(\${centerX},\${centerY})\`)
            .attr("d", arcGenerator)
            .attr("fill", "#eee")
            .attr("stroke", "#ccc");
          continue;
        }
        svg.append("path")
          .attr("transform", \`translate(\${centerX},\${centerY})\`)
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
          const textPathId = \`textPath-\${i}-\${k}-line\${idx}\`;
          svg.append("defs")
            .append("path")
            .attr("id", textPathId)
            .attr("transform", \`translate(\${centerX},\${centerY})\`)
            .attr("d", lineArcGen());
          const lineArcLength = angleDiff * lineRadius;
          svg.append("text")
            .style("font-size", DEFAULT_FONT_SIZE + "px")
            .style("fill", "#fff")
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
