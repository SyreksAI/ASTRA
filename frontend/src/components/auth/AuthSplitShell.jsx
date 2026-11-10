import React from 'react';

import { Link } from 'react-router-dom';

import { CosmosBackground } from './CosmosBackground';



const NAV = ['Люди', 'Идеи', 'Созвездия', 'Ты'];



export function AuthSplitShell({ children }) {

    return (

        <div className="auth-landing auth-landing--fullscreen">

            <CosmosBackground />



            <div className="auth-landing__overlay">

                <header className="auth-landing__top">

                    <Link to="/login" className="auth-landing__top-brand">

                        <img src="/auth/elara-logo.png" alt="Elara" className="auth-landing__top-logo" />

                    </Link>

                    <nav className="auth-landing__top-nav" aria-label="Разделы">

                        {NAV.map((item, i) => (

                            <span key={item}>

                                {i > 0 && <span className="auth-landing__dot">·</span>}

                                <span>{item}</span>

                            </span>

                        ))}

                    </nav>

                </header>



                <main className="auth-landing__stage">

                    <div className="auth-landing__hero">

                        <div className="auth-landing__visual-content">

                            <p className="auth-landing__visual-tag">Создавай · Общайся · Открывай · Вдохновляйся</p>

                            <h1>Ближе к тому,<br />что важно</h1>

                            <p>

                                Elara — социальная вселенная, где люди, идеи и события

                                образуют свои созвездия

                            </p>

                        </div>

                        <div className="auth-landing__social-proof">

                            <div className="auth-landing__avatars">

                                <span /><span /><span />

                            </div>

                            <p>Реальные люди. Настоящие интересы. Без лишнего шума</p>

                        </div>

                    </div>



                    <div className="auth-landing__form-panel">

                        {children}

                    </div>

                </main>

            </div>

        </div>

    );

}


