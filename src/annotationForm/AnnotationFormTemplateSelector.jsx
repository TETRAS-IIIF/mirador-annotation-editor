import React from 'react';
import Typography from '@mui/material/Typography';
import { alpha, styled } from '@mui/material/styles';
import {
    Card, CardActionArea, CardContent, Grid,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { MEDIA_TYPES, TEMPLATE_TYPES } from './AnnotationFormUtils';

/**
 * A component that renders a selection of annotation
 * form templates for different types of comments.
 */
export default function AnnotationFormTemplateSelector({
                                                           mediaType,
                                                           setCommentingType,
                                                       }) {
    const { t } = useTranslation();
    const setCommentType = (template) => setCommentingType(template);
    const templates = TEMPLATE_TYPES(t);

    return (
        <CardContainer>
            {mediaType === MEDIA_TYPES.AUDIO ? (
                <Grid container spacing={1} direction="column">
                    <Grid>
                        <Typography>{t('audio_not_supported')}</Typography>
                    </Grid>
                </Grid>
            ) : (
                templates.map((template) => (
                    template.isCompatibleWithTemplate(mediaType) && (
                        <MaeCard key={template.id}>
                            <MaeActionArea id={template.id} onClick={() => setCommentType(template)}>
                                <CardContent>
                                    <MaeTitle component="div">
                                        {t(template.label)}
                                        {template.icon}
                                    </MaeTitle>
                                    <MaeDescription component="div" variant="body2">
                                        {t(template.description)}
                                    </MaeDescription>
                                </CardContent>
                            </MaeActionArea>
                        </MaeCard>
                    )
                ))
            )}
        </CardContainer>
    );
}

const CardContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3.75), // 30px
    margin: theme.spacing(1.25), // 10px
}));

const MaeCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    border: `1px solid ${alpha(theme.palette.primary?.main ?? '#5A8264', 0.25)}`,
    transition: 'box-shadow 120ms ease, transform 120ms ease, border-color 120ms ease',
    '&:hover': {
        boxShadow: theme.shadows[3],
        borderColor: alpha(theme.palette.primary?.main ?? '#5A8264', 0.5),
        transform: 'translateY(-1px)',
    },
}));

const MaeActionArea = styled(CardActionArea)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary?.main ?? '#5A8264', 0.06),
    },
}));

const MaeTitle = styled(Typography)(({ theme }) => {
    const f = (theme.typography).formSectionTitle ?? {};
    return {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(1),
        color: f.color ?? theme.palette.primary?.main ?? '#5A8264',
        fontSize: f.fontSize ?? theme.typography.h6.fontSize,
        fontWeight: f.fontWeight ?? 600,
        letterSpacing: f.letterSpacing ?? '0.02em',
        textTransform: f.textTransform ?? 'none',
        lineHeight: 1.25,
        marginBottom: theme.spacing(0.5),
    };
});

const MaeDescription = styled(Typography)(({ theme }) => {
    const f = (theme.typography).subFormSectionTitle ?? {};
    return {
        color: theme.palette.text.secondary,
        fontSize: f.fontSize ?? theme.typography.body2.fontSize,
        fontWeight: f.fontWeight ?? 300,
        letterSpacing: f.letterSpacing ?? 0,
        lineHeight: f.lineHeight ?? theme.typography.body2.lineHeight,
        textTransform: f.textTransform ?? 'none',
    };
});

AnnotationFormTemplateSelector.propTypes = {
    mediaType: PropTypes.string.isRequired,
    setCommentingType: PropTypes.func.isRequired,
};
