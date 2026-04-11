import React from "react";

function LoginVisualPanel({ title, tag, onBack, backLabel = "Back to Portal" }) {
  return (
    <div className="login-showcase-visual">
      <div className="login-visual-top">
        {onBack ? (
          <button type="button" className="login-visual-back-link" onClick={onBack}>
            {backLabel}
          </button>
        ) : null}
        {tag ? <p className="login-visual-tag">{tag}</p> : null}
        {title ? <h2 className="login-visual-title">{title}</h2> : null}
        <div className="login-leaf login-leaf-left" />
        <div className="login-leaf login-leaf-center" />
        <div className="login-leaf login-leaf-right" />
        <div className="login-hill login-hill-left" />
        <div className="login-hill login-hill-right" />
        <div className="login-dot-cluster" />
      </div>
    </div>
  );
}

export default LoginVisualPanel;
