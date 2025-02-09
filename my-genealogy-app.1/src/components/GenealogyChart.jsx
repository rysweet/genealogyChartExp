import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import PersonEditForm from "./PersonEditForm";

const RING_WIDTH = 100;  // radial width for each generation ring
const ARC_PADDING = 2;   // spacing (in pixels or degrees) between arcs

export default function GenealogyChart({ people, maxGenerations, centerPersonId, onUpdatePeople }) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

  useEffect(() => {
    if (!people || people.length === 0) return;
    drawChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, maxGenerations]);

  const drawChart = () => {
    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create a lookup map for quick ID -> Person
    const peopleMap = new Map(people.map((p) => [p.id, p]));

    // Recursively compute the generation # for a given person
    const getGeneration = (personId, visited = new Set()) => {
      if (personId === centerPersonId) return 0;
      if (visited.has(personId)) return Infinity;
      visited.add(personId);
      const person = peopleMap.get(personId);
      if (!person || !person.parents || person.parents.length === 0) {
        // No parents => treat as top generation from this chain
        return 9999; // effectively very high if it doesn't connect to center
      }
      // generation = 1 + min among parents
      let gens = person.parents.map((pid) => getGeneration(pid, visited));
      return Math.min(...gens) + 1;
    };

    // Filter only those within maxGenerations of the center
    const filteredPeople = people.filter((p) => getGeneration(p.id) < maxGenerations);

    // Group by generation
    const generations = d3.group(filteredPeople, (p) => getGeneration(p.id));

    // For each generation ring, draw arcs
    for (let g = 0; g < maxGenerations; g++) {
      const genPeople = generations.get(g);
      if (!genPeople) continue;

      const ringRadiusInner = g * RING_WIDTH + 50; // offset from center
      const ringRadiusOuter = ringRadiusInner + RING_WIDTH - ARC_PADDING;

      const arcAngle = (2 * Math.PI) / genPeople.length;

      genPeople.forEach((person, i) => {
        const startAngle = i * arcAngle;
        // subtract a tiny fraction to create spacing
        const endAngle = startAngle + arcAngle - (ARC_PADDING * Math.PI / 180);

        const arcGenerator = d3.arc()
          .innerRadius(ringRadiusInner)
          .outerRadius(ringRadiusOuter)
          .startAngle(startAngle)
          .endAngle(endAngle);

        // Draw arc
        svg.append("path")
          .attr("d", arcGenerator)
          .attr("transform", "translate(" + centerX + ", " + centerY + ")")
          .attr("fill", "#ddd")
          .attr("stroke", "#999")
          .on("click", () => {
            setSelectedPersonId(person.id);
          });

        // Add text along arc
        const textPathId = "textPath-" + person.id;
        svg.append("defs")
          .append("path")
          .attr("id", textPathId)
          .attr("d", arcGenerator())
          .attr("transform", "translate(" + centerX + ", " + centerY + ")");

        svg.append("text")
          .append("textPath")
          .attr("xlink:href", "#" + textPathId)
          .attr("startOffset", "25%")
          .style("fontSize", "12px")
          .style("textAnchor", "middle")
          .text(
            person.firstName +
            " " +
            person.lastName +
            " (" +
            person.birthDate +
            " - " +
            person.deathDate +
            ")"
          );
      });
    }
  };

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
    <div>
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
