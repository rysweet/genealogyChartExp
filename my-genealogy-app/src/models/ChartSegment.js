import { arc, color } from 'd3';  // Import specific d3 functions instead of full package

export class ChartSegment {
  constructor({
    person,
    generation,
    position,
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    color,
    isSelected
  }) {
    this.person = person;
    this.generation = generation;
    this.position = position;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.color = color;
    this.isSelected = isSelected;
  }

  get arcLength() {
    const midRadius = (this.innerRadius + this.outerRadius) / 2;
    return Math.abs(this.endAngle - this.startAngle) * midRadius;
  }

  get textColor() {
    // Convert color to relative luminance and determine text color
    const c = color(this.color);  // Use imported color function
    if (!c) return '#000000';
    
    const rgb = [c.r, c.g, c.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    
    const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  get displayText() {
    if (!this.person) return "Unknown";
    return `${this.person.firstName} ${this.person.lastName}`;
  }

  get borderProperties() {
    return {
      color: this.isSelected ? '#ff9800' : '#333',
      width: this.isSelected ? 3 : 1
    };
  }

  createArcGenerator() {
    return arc()  // Use imported arc function directly
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius)
      .startAngle(this.startAngle)
      .endAngle(this.endAngle);
  }

  get midRadius() {
    return (this.innerRadius + this.outerRadius) / 2;
  }

  get midAngle() {
    return (this.startAngle + this.endAngle) / 2;
  }

  // Add constant for text inset margin
  static TEXT_INSET = 10; // Increased inset margin

  static TEXT_INSET_PERCENTAGE = 0.15; // Use percentage of arc span instead of fixed pixels

  get effectiveArcLength() {
    const segmentSpan = this.endAngle - this.startAngle;
    const insetAngle = segmentSpan * ChartSegment.TEXT_INSET_PERCENTAGE;
    const effectiveSpan = segmentSpan - (2 * insetAngle);
    return effectiveSpan * this.midRadius;
  }

  createTextArcGenerator(lineRadius) {
    // Calculate the total angular span of the segment
    const segmentSpan = this.endAngle - this.startAngle;
    
    // Calculate inset as a percentage of the segment span
    const insetAngle = segmentSpan * ChartSegment.TEXT_INSET_PERCENTAGE;
    
    // Calculate the text path start and end angles with proportional insets
    const textStartAngle = this.startAngle + insetAngle;
    const textEndAngle = this.endAngle - insetAngle;

    return arc()  // Use imported arc function directly
      .innerRadius(lineRadius)
      .outerRadius(lineRadius)
      .startAngle(textStartAngle)
      .endAngle(textEndAngle);
  }

  getTextTransform(lineRadius) {
    const segmentSpan = this.endAngle - this.startAngle;
    const insetAngle = segmentSpan * ChartSegment.TEXT_INSET_PERCENTAGE;
    const midAngle = this.startAngle + (segmentSpan / 2);
    
    const degrees = (midAngle * 180) / Math.PI - 90;
    const shouldReverse = degrees > 90 && degrees < 270;

    return {
      x: 0,
      y: 0,
      rotate: shouldReverse ? degrees + 180 : degrees,
      reverse: shouldReverse,
      startOffset: '50%',
      textAnchor: 'middle',
      alignmentBaseline: 'middle'
    };
  }

  getTextLines(text, maxWidth, fontSize = 8) {
    // Use effectiveArcLength instead of arcLength for text wrapping
    const words = text.split(' ');
    const lines = [];
    let currentLine = [];
    
    words.forEach(word => {
      const testLine = [...currentLine, word].join(' ');
      if (this.approximateTextWidth(testLine, fontSize) <= this.effectiveArcLength) {
        currentLine.push(word);
      } else {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        currentLine = [word];
      }
    });
    
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }
    
    return lines;
  }

  approximateTextWidth(text, fontSize) {
    return text.length * (fontSize * 0.6);
  }

  // Calculate optimal text placement
  getTextPlacement(totalLines, lineSpacing = 10) {
    const totalHeight = (totalLines - 1) * lineSpacing;
    const outermostRadius = this.midRadius + totalHeight / 2;
    
    return {
      outermostRadius,
      lineSpacing,
      getLineRadius: (lineIndex) => outermostRadius - lineIndex * lineSpacing
    };
  }
}
