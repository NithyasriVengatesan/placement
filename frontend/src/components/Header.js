import React from "react";
import "../App.css";
import leaderOne from "../assets/1.jpg";
import leaderTwo from "../assets/2.jpg";
import logo from "./logo.jpg";

function Header({ onOpenLogin, currentUser, onLogout, hideAuthControls = false }) {

return(

<div className="navbar">

<div className="nav-left">
<div className="leader-stack">
<img
src={leaderOne}
alt="Institution leader one"
className="leader-photo"
/>
<img
src={leaderTwo}
alt="Institution leader two"
className="leader-photo"
/>
</div>

</div>

<div className="header-center">
<div className="header-identity">
<div className="header-logo-slot">
<img
src={logo}
alt="Ramco Institute of Technology logo"
className="header-logo"
/>
</div>
<div className="header-copy">
<h1>Ramco Institute of Technology</h1>
<h2>(An Autonomous Institution)</h2>
<p>Approved by AICTE, New Delhi &amp; Affiliated to Anna University, Chennai</p>
<p>NAAC Accredited with &apos;A+&apos; Grade &amp; An ISO 9001:2015 Certified Institution</p>
<p>NBA Accredited UG Programs: CSE, EEE, ECE, MECH and CIVIL</p>
</div>
</div>
</div>
<div className="nav-right">
{hideAuthControls ? (
<div className="header-auth-spacer" />
) : currentUser ? (
<div className="header-user-box">
<span className="header-user-name">{currentUser.username}</span>
<button type="button" className="header-login-button" onClick={onLogout}>
Logout
</button>
</div>
) : (
<button type="button" className="header-login-button" onClick={onOpenLogin}>
Login
</button>
)}
</div>

</div>

);

}

export default Header;
