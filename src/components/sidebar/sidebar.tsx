import {Box, Button, useDisclosure, VStack,} from '@chakra-ui/react';
import {FiArrowLeft, FiSettings} from "react-icons/fi";
import {sidebarStyles} from './sidebar-styles';
import SettingUI from './setting/setting-ui';
import ConfigCard from './config-card';
import ChatHistoryPanel from './chat-history-panel';
import SystemLogPanel from './system-log-panel';

interface SidebarProps {
  onToggle: () => void;
}

function Sidebar({ onToggle }: SidebarProps) {
  const { open, onOpen, onClose } = useDisclosure();

  return (
    <VStack {...sidebarStyles.sidebar.self}>
      {!open ? (
        <>
          <Box {...sidebarStyles.sidebar.header}>
            <Box display="flex" gap={1}>

              <Button onClick={onOpen}>
                <FiSettings />
              </Button>
            </Box>
            <ConfigCard />
          </Box>

          <Box {...sidebarStyles.sidebar.container}>
            <ChatHistoryPanel />
            <SystemLogPanel />
          </Box>

          <Button {...sidebarStyles.sidebar.collapseArrow} onClick={onToggle}>
            <FiArrowLeft/>
          </Button>
        </>
      ) : (
        <SettingUI open={open} onClose={onClose} onToggle={onToggle} />
      )}
    </VStack>
  );
}

export default Sidebar;
