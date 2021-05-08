/* eslint template-curly-spacing: 0, indent: 0 */
import React, { Suspense, lazy, useEffect, useState, useRef, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Drawer } from '@material-ui/core';
import { navigate, useIntl } from 'gatsby-plugin-intl';
import { v4 as uuid } from 'uuid';
import useDetectPrint from 'use-detect-print';

// Components
import SEO from '../components/SEO';
import Layout from '../components/Layout';
import A4Container from '../components/A4Container';
import ResumeDrawerItems from '../components/ResumeDrawerItems/ResumeDrawerItems';
import FloatingButton from '../components/FloatingButton';

// Hooks
import { useSelector } from '../store/StoreProvider';

// Utils
import { isObjectNotEmpty } from '../utils/utils';

// Selectors
import { selectJsonResume, selectResumeTemplate, selectTogglableJsonResume } from '../store/selectors';

const useStyles = makeStyles((theme) => ({
    resumeWrapper: {
        margin: '10px 0',
    },
    drawerWrapper: {
        '& .MuiPaper-root': {
            zIndex: 1000,
        },
    },
}));

const importTemplate = (template) => lazy(() =>
    import(`../components/ResumeTemplates/${template}/Index`).catch(() =>
        import('../components/ResumeTemplates/Default/Index')));

const BuildPage = () => {
    const intl = useIntl();
    const classes = useStyles();
    const [a4ContainerHeight, setA4ContainerHeight] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [resumeTemplate, setResumeTemplate] = useState([]);
    const refContainer = useRef(null);
    const rerenderRef = useRef(false);
    const jsonResume = useSelector(selectJsonResume);
    const togglableJsonResume = useSelector(selectTogglableJsonResume);
    const resumeTemplateName = useSelector(selectResumeTemplate);
    const hasData = isObjectNotEmpty(togglableJsonResume) && isObjectNotEmpty(jsonResume);
    const isPrinting = useDetectPrint();

    useEffect(() => {
        if (!hasData) {
            navigate('/');
        }
    }, [hasData]);

    useEffect(() => {
        async function loadTemplate() {
            const Template = await importTemplate(resumeTemplateName);
            setResumeTemplate([
                <Template
                    key={uuid()}
                    resume={togglableJsonResume}
                    // eslint-disable-next-line no-underscore-dangle
                    customTranslations={jsonResume.__translation__}
                    isPrinting={isPrinting}
                />,
            ]);
        }
        loadTemplate();
    }, [isPrinting, resumeTemplateName, togglableJsonResume, jsonResume]);

    const printDocument = useCallback(() => {
        const size = 1122; // roughly A4
        const resumeHeight = refContainer?.current?.clientHeight;
        const ratio = resumeHeight / size;
        if (resumeHeight && ratio > 1) {
            const vhs = Math.ceil(
                parseFloat(ratio.toFixed(2))
            );
            setA4ContainerHeight(vhs * 100);
        } else {
            window.print();
        }
    }, [refContainer]);

    useEffect(() => {
        // hack to make the printable page background correct
        if (rerenderRef.current) {
            if (a4ContainerHeight) {
                window.print();
                window.setTimeout(() => {
                    setA4ContainerHeight(null);
                }, 10);
            }
        } else {
            rerenderRef.current = true;
        }
    }, [a4ContainerHeight]);

    return (
        <Layout>
            <SEO
                title={intl.formatMessage({ id: 'build_resume' })}
                robots="noindex, nofollow"
            />
            {hasData && (
                <div className={classes.resumeWrapper}>
                    <FloatingButton
                        onClick={() => setIsDrawerOpen(true)}
                    />
                    <Drawer
                        className={classes.drawerWrapper}
                        anchor="right"
                        variant="persistent"
                        open={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                    >
                        <ResumeDrawerItems
                            resume={togglableJsonResume}
                            jsonResume={jsonResume}
                            onClose={() => setIsDrawerOpen(false)}
                            onPrint={printDocument}
                        />
                    </Drawer>
                    <div
                        ref={refContainer}
                    >
                        <A4Container
                            alignCenter={!isDrawerOpen}
                            customHeight={a4ContainerHeight}
                        >
                            <Suspense
                                fallback={intl.formatMessage({ id: 'loading' })}
                            >
                                {resumeTemplate}
                            </Suspense>
                        </A4Container>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default BuildPage;
