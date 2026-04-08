import React from "react";

function LoginVisualPanel({ title = "Placement Portal", caption = "Secure access for campus placement workflows." }) {
  return (
    <div className="login-showcase-visual">
      <div className="login-visual-stack">
        <div className="login-monster login-monster-pink-top">
          <div className="login-monster-eyes">
            <span />
            <span />
          </div>
        </div>

        <div className="login-monster login-monster-big-pink">
          <div className="login-monster-eye-single" />
          <div className="login-monster-mouth" />
        </div>

        <div className="login-monster login-monster-cloud">
          <div className="login-monster-eyes">
            <span />
            <span />
          </div>
        </div>

        <div className="login-monster login-monster-blue">
          <div className="login-monster-eyes">
            <span />
            <span />
          </div>
          <div className="login-monster-mouth login-monster-mouth-blue" />
        </div>
      </div>

      <div className="login-visual-copy">
        <p className="login-visual-tag">Campus Access</p>
        <h2>{title}</h2>
        <p>{caption}</p>
      </div>
    </div>
  );
}

export default LoginVisualPanel;
