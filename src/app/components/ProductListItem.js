import React, { Component } from 'react'

import './ProductListItem.css'


const HighlightedText = ({ field, text, matches  }) => {
  // Sort highlights by starting position to ensure proper order
  // We'll build an array of React elements corresponding to segments of text.
  const segments = [];
  let currentIndex = 0;

  if (matches && matches[field]) {
    matches[field].forEach((match, i) => {
      // Push the text before the highlight (if any)
      const start = match.begin
      const end = match.end
      if (currentIndex < start) {
        segments.push(
          <span key={`normal-${i}-before`}>
            {text.slice(currentIndex, start)}
          </span>
        );
      }

      var color = match.score > 1 ? 'black' : 'red'

      // Push the highlighted text
      segments.push(
        <span key={`highlight-${i}`} style={{ fontWeight: 'bold', color }}>
          {text.slice(start, end)}
        </span>
      );

      // Update the current index to the end of this highlight
      currentIndex = end;
    });
  }
  // If there's remaining text after the last highlight
  if (currentIndex < text.length) {
    segments.push(
      <span key="normal-last">{text.slice(currentIndex)}</span>
    );
  }

  return <div>{segments}</div>;
};

const TagsText = ({ text, matches  }) => {
  // Sort highlights by starting position to ensure proper order
  // We'll build an array of React elements corresponding to segments of text.
  const segments = [];
  let currentIndex = 0;

  if (matches && matches["tags"]) {
    matches["tags"].forEach((match, i) => {
      // Push the text before the highlight (if any)
      const start = match.begin
      const end = match.end
      var color = match.score > 1 ? 'black' : 'red'

      if (segments.length > 0) {
        segments.push(
          <span key={`normal-${i}-before`}>, </span>
        );
      }

      // Push the highlighted text
      segments.push(
        <span key={`highlight-${i}`} style={{ color }}>
          {text.slice(start, end)}
        </span>
      );

      // Update the current index to the end of this highlight
      currentIndex = end;
    });
  }

  return <div style={{fontStyle: 'italic'}} >tags: {segments}</div>;
};

class ProductListItem extends Component {
  render() {
    const { item } = this.props
    const imageUrl = `https://public.keskofiles.com/f/k-ruoka/product/${item.id}?w=95&h=95&fm=jpg&q=90&fit=fill&bg=ffffff&dpr=2`

    const actionClass = `ProductListItem__action ProductListItem__action--${this.props.color}`

    var tags = null
    if (item.$matches && item.$matches["tags"] && item.$matches["tags"].length > 0) {
      tags = <TagsText text={item.tags} matches={item.$matches} />
    }

    return (
      <div className="ProductListItem">
        <div className="ProductListItem__left">
          <img className="ProductListItem__image" src={imageUrl} alt="" />
          <span className="ProductListItem__name">
            <HighlightedText field="name" text={item.name} matches={item.$matches} />
            {tags}
            </span>
        </div>
        <button className={actionClass} href="#" onClick={this.props.onActionClick}>
          {this.props.actionElement}
        </button>
      </div>
    )
  }
}


export default ProductListItem
