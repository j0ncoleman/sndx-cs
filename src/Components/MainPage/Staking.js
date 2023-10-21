import React, { useState, useEffect } from "react";
import { Div, Input, Button, Image, Text } from "atomize";
import "./fadeIn.css"; // Import the CSS file for the animation
import sndx from "./sndx.png";

export const Staking = ({ connected }) => {
  const moment = require('moment');

  const [blurAmount, setBlurAmount] = useState(10);
  const blurStyle = {
    filter: `blur(${blurAmount}px)`,
    transition: "filter 1s ease-in",
  };

  const [loaded, setLoaded] = useState(false);
  const [hideImage, setHideImage] = useState(false);
  const [showText, setShowText] = useState(false);
  const [animateBackground, setAnimateBackground] = useState(false);

  useEffect(() => {
      setLoaded(true);
      const timeout1 = setTimeout(() => {
          setHideImage(true);
      }, 3000); 

      const timeout2 = setTimeout(() => {
          setShowText(true);
      }, 4000);

      const timeout3 = setTimeout(() => {
          setAnimateBackground(true);
      }, 5000);

      return () => {
          clearTimeout(timeout1);
          clearTimeout(timeout2);
          clearTimeout(timeout3);
      };
  }, []);

  return (
    <Div w="100vw" h="100vh" d="flex" align="center" justify="center">
      <Div
        className={animateBackground ? 'animate-gradient-background' : ''}
        pos="fixed"
        w="100vw"
        h="100vh"
        textColor="black"
        left="0"
        top="0"
        rounded="10px"
        textSize="10px"
        d="flex"
        flexDir="column"
        align="center"
        justify="center"
        style={{background: 'linear-gradient(black, #303030)'}}>
        <Image
            className={`${loaded ? 'image-reveal-animation' : ''} ${hideImage ? 'hide-element' : ''}`}
            src={sndx}
            alt="defi apes"
            w={{ xl: "100rem", xs: "30rem" }}
        />
        <Div 
            className={`${showText ? 'text-reveal-animation' : 'hide-text'}`}
            style={{
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)'
            }}
            textSize={{xl: "100px", xs: "40px"}}
            textColor="white"
            d="flex"
            flexDir="column"
            align="center"
            justify="center"
        >
              Coming Soon
              <Button bg="white" w="15rem" textColor="#303030" textWeight="bold" m={{t: "3rem"}} tag="a" href="https://t.me/NeutronCrypto">Request Beta Access</Button>
          </Div>
      </Div>
    </Div>
  );
};
