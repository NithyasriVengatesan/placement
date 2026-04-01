import React from "react";
import "./ProgressBar.css";

function ProgressBar({ step }) {

const steps = [
"Basic",
"Languages",
"Parent",
"School",
"College",
"Skills",
"Projects",
"Intern",
"Certify",
"Placement",
"Docs",
"Declare"
];

const progressWidth = ((step-1)/(steps.length-1))*100;

return(

<div className="progress-wrapper">

<div className="progress-container">

<div className="progress-line">

<div 
className="progress-fill"
style={{width:progressWidth+"%"}}
/>

</div>

{steps.map((label,index)=>{

const stepNumber=index+1;

return(

<div className="step-item" key={index}>

<div

className={`step-circle
${step===stepNumber?"active":""}
${step>stepNumber?"completed":""}
`}

>

{step>stepNumber ? "✓" : stepNumber}

</div>

<div className={`step-label
${step===stepNumber?"active-label":""}
`}>

{label}

</div>

</div>

);

})}

</div>

</div>

);

}

export default ProgressBar;
