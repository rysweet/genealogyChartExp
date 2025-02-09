import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import PersonEditForm from "./PersonEditForm";

const RING_WIDTH = 100; // radial width per generation
const ARC_PADDING = 0;  // small gap (in degrees) between arcs, if desired
const CENTER_RADIUS = 30; // radius for the center circle

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

  function drawChart() {
    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear the existing SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Create base SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Map of id -> person object for quick lookup
    const peopleMap = new Map(people.map((p) => [p.id, p]));

    // Build BFS arrays of ancestors up to `maxGenerations - 1`
    // ancestors[i] = array of length 2^i (for i >= 1).
    // ancestors[0] = [centerId]
    const ancestors = [];
    for (let i = 0; i < maxGenerations; i++) {
      ancestors[i] = new Array(2 ** i).fill(null);
    }
    // Generation 0: just the center person
    ancestors[0][0] = centerPersonId;

    // Fill subsequent generations
    for (let i = 0; i < maxGenerations - 1; i++) {
      const size = 2 ** i; // number in this generation
      for (let j = 0; j < size; j++) {
        const personId = ancestors[i][j];
        if (!personId) continue; // skip if empty slot
        const person = peopleMap.get(personId);
        if (!person) continue;

        // father => next gen slot [2*j], mother => next gen slot [2*j + 1]
        if (person.parents && person.parents.length > 0) {
          ancestors[i + 1][2 * j] = person.parents[0] || null; // father
        }
        if (person.parents && person.parents.length > 1) {
          ancestors[i + 1][2 * j + 1] = person.parents[1] || null; // mother
        }
      }
    }

    // 1) Draw the center as a circle
    const centerPerson = peopleMap.get(centerPersonId);
    svg
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", CENTER_RADIUS)
      .attr("fill", "#F6C")
      .attr("stroke", "#333")
      .on("click", () => {
        setSelectedPersonId(centerPersonId);
      });

    // Label the center
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", centerY + 4) // slight offset
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(
        centerPerson
          ? `${centerPerson.firstName} ${centerPerson.lastName}`
          : "Unknown"
      );

    // 2) For each generation i (1..maxGenerations-1), draw arcs
    for (let i = 1; i < maxGenerations; i++) {
      const genArray = ancestors[i]; // up to 2^i individuals
      const n = 2 ** i; // number of arc segments
      const arcAngle = (2 * Math.PI) / n - (ARC_PADDING * Math.PI) / 180;

      // define ring radii
      const innerRadius = (i - 1) * RING_WIDTH + CENTER_RADIUS + 10;
      const outerRadius = i * RING_WIDTH + CENTER_RADIUS;

      for (let k = 0; k < n; k++) {
        const personId = genArray[k];
        const startAngle = k * ((2 * Math.PI) / n);
        const endAngle = startAngle + arcAngle;

        // We use a D3 arc generator
        const arcGenerator = d3
          .arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(startAngle)
          .endAngle(endAngle);

        // For convenience, if there's no person, we can either skip or draw a "blank" arc
        if (!personId) {
          // Option A: skip drawing this arc
          // continue;

          // Option B: draw a blank arc
          svg
            .append("path")
            .attr("transform", `translate(${centerX}, ${centerY})`)
            .attr("d", arcGenerator)
            .attr("fill", "#eee")
            .attr("stroke", "#ccc");
          // no label
          continue;
        }

        // If person exists, draw the arc interactive
        svg
          .append("path")
          .attr("transform", `translate(${centerX}, ${centerY})`)
          .attr("d", arcGenerator)
          .attr("fill", "#ddd")
          .attr("stroke", "#999")
          .on("click", () => {
            setSelectedPersonId(personId);
          });

        // Add a text path for the label
        const textPathId = `textPath-${i}-${k}`;
        svg
          .append("defs")
          .append("path")
          .attr("id", textPathId)
          .attr("d", arcGenerator())
          .attr("transform", `translate(${centerX}, ${centerY})`);

        const person = peopleMap.get(personId);
        let label = "Unknown";
        if (person) {
          label = `${person.firstName} ${person.lastName} (${person.birthDate} - ${person.deathDate})`;
        }

        svg
          .append("text")
          .append("textPath")
          .attr("xlink:href", `#${textPathId}`)
          .attr("startOffset", "25%")
          .style("font-size", "12px")
          .style("text-anchor", "middle")
          .text(label);
      }
    }
  }

  // Editing logic
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