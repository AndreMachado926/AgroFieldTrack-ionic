import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#004030', // Verde escuro principal
    },
    secondary: {
      main: '#4A9782', // Verde médio
    },
    background: {
      default: '#FFF9E5', // Fundo amarelo claro
      paper: '#DCD0A8', // Fundo dos cards
    },
    text: {
      primary: '#004030', // Texto principal
      secondary: '#63756c', // Texto secundário
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      color: '#004030',
      fontWeight: 700,
    },
    h4: {
      color: '#004030',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          backgroundColor: '#004030',
          color: '#FFF9E5',
          '&:hover': {
            backgroundColor: '#2d7f64',
          },
        },
        outlined: {
          borderColor: '#4A9782',
          color: '#4A9782',
          '&:hover': {
            borderColor: '#2d7f64',
            backgroundColor: 'rgba(74, 151, 130, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#DCD0A8',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#004030',
          color: '#FFF9E5',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 64, 48, 0.5)',
          },
        },
      },
    },
  },
});