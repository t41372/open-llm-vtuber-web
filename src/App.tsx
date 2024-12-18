// import { StrictMode } from 'react';
import {
  Box,
  Flex,
  ChakraProvider,
  defaultSystem,
  Button,
} from "@chakra-ui/react";
import Canvas from "./components/canvas/canvas";
import Sidebar from "./components/sidebar/sidebar";
import Footer from "./components/footer/footer";
import { AiStateProvider } from "./context/ai-state-context";
import { L2DProvider } from "./context/l2d-context";
import { SubtitleProvider } from "./context/subtitle-context";
import { BgUrlProvider } from "./context/bgurl-context";
import { layoutStyles } from "./layout";
import WebsocketConnection from "./components/websocket-connection";
import { ResponseProvider } from "./context/response-context";
import { useState, useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";

const App: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

  useEffect(() => {
    const duration = 300;
    const steps = 30;
    const interval = duration / steps;

    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i <= steps; i++) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, interval * i);
      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isFooterCollapsed, showSidebar]);

  return (
    <ChakraProvider value={defaultSystem}>
      <AiStateProvider>
        <L2DProvider>
          <SubtitleProvider>
            <ResponseProvider>
              <BgUrlProvider>
                <WebsocketConnection>
                  <Flex {...layoutStyles.appContainer}>
                    {showSidebar && (
                      <Box {...layoutStyles.sidebar}>
                        <Sidebar
                          onToggle={() => setShowSidebar(!showSidebar)}
                        />
                      </Box>
                    )}

                    <Box {...layoutStyles.mainContent}>
                      {!showSidebar && (
                        <Button
                          {...layoutStyles.sidebarToggleButton}
                          onClick={() => setShowSidebar(true)}
                        >
                          <FiArrowRight />
                        </Button>
                      )}

                      <Box {...layoutStyles.canvas}>
                        <Canvas />
                      </Box>

                      <Box
                        {...layoutStyles.footer}
                        {...(isFooterCollapsed && layoutStyles.collapsedFooter)}
                      >
                        <Footer
                          isCollapsed={isFooterCollapsed}
                          onToggle={() =>
                            setIsFooterCollapsed(!isFooterCollapsed)
                          }
                        />
                      </Box>
                    </Box>
                  </Flex>
                </WebsocketConnection>
              </BgUrlProvider>
            </ResponseProvider>
          </SubtitleProvider>
        </L2DProvider>
      </AiStateProvider>
    </ChakraProvider>
  );
};

export default App;
