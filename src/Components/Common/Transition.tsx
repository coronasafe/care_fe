import { CSSTransition as ReactCSSTransition } from "react-transition-group";
import { createContext, useContext, useEffect, useRef } from "react";

type TransitionContextProps = {
  parent: {
    show: boolean;
    isInitialRender: boolean;
    appear?: boolean;
  };
};

const TransitionContext = createContext<Partial<TransitionContextProps>>({
  parent: {
    show: false,
    isInitialRender: true,
  },
});

function useIsInitialRender() {
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  return isInitialRender.current;
}

interface TransitionProps {
  show?: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  appear?: boolean;
  children: React.ReactNode;
}

function CSSTransition({
  show,
  enter = "",
  enterFrom = "",
  enterTo = "",
  leave = "",
  leaveFrom = "",
  leaveTo = "",
  appear,
  children,
}: TransitionProps) {
  const enterClasses = enter.split(" ").filter((s) => s.length);
  const enterFromClasses = enterFrom.split(" ").filter((s) => s.length);
  const enterToClasses = enterTo.split(" ").filter((s) => s.length);
  const leaveClasses = leave.split(" ").filter((s) => s.length);
  const leaveFromClasses = leaveFrom.split(" ").filter((s) => s.length);
  const leaveToClasses = leaveTo.split(" ").filter((s) => s.length);

  function addClasses(node: HTMLElement, classes: string[]): void {
    if (classes.length) {
      node.classList.add(...classes);
    }
  }

  function removeClasses(node: HTMLElement, classes: string[]): void {
    if (classes.length) {
      node.classList.remove(...classes);
    }
  }

  return (
    <ReactCSSTransition
      appear={appear}
      unmountOnExit
      in={show}
      timeout={undefined as unknown as any}
      addEndListener={(node, done) => {
        node.addEventListener("transitionend", done, false);
      }}
      onEnter={(node: any) => {
        addClasses(node, [...enterClasses, ...enterFromClasses]);
      }}
      onEntering={(node: any) => {
        removeClasses(node, enterFromClasses);
        addClasses(node, enterToClasses);
      }}
      onEntered={(node: any) => {
        removeClasses(node, [...enterToClasses, ...enterClasses]);
      }}
      onExit={(node: any) => {
        addClasses(node, [...leaveClasses, ...leaveFromClasses]);
      }}
      onExiting={(node: any) => {
        removeClasses(node, leaveFromClasses);
        addClasses(node, leaveToClasses);
      }}
      onExited={(node: any) => {
        removeClasses(node, [...leaveToClasses, ...leaveClasses]);
      }}
    >
      {children}
    </ReactCSSTransition>
  );
}

function Transition({ show, appear, ...rest }: TransitionProps) {
  const { parent } = useContext(TransitionContext);
  const isInitialRender = useIsInitialRender();
  const isChild = show === undefined;

  if (isChild) {
    return (
      <CSSTransition
        appear={parent ? parent.appear || !parent.isInitialRender : false}
        show={parent?.show ? parent.show : false}
        {...rest}
      />
    );
  }

  return (
    <TransitionContext.Provider
      value={{
        parent: {
          show: Boolean(show),
          isInitialRender,
          appear,
        },
      }}
    >
      <CSSTransition appear={appear} show={show} {...rest} />
    </TransitionContext.Provider>
  );
}

export default Transition;
