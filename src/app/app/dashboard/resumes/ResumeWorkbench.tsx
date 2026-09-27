import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { preloadFontFamily } from "@/utils/fonts";
import { useResumeStore } from "@/store/useResumeStore";
import { DEFAULT_TEMPLATES } from "@/config";
import { CreateResumeModal } from "./CreateResumeModal";
import { ImportResumeDialog } from "./ImportResumeDialog";
import { ResumeCardItem } from "./ResumeCardItem";
import { AnimatedImportButton } from "./AnimatedImportButton";
import { SpaceStatusBar } from "@/components/space/SpaceStatusBar";

export const ResumeWorkbench = () => {
    const t = useTranslations();
    const locale = useLocale();
    const {
        resumes,
        setActiveResume,
        addResume,
        deleteResume,
        createResume,
    } = useResumeStore();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const jsonFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fontFamilies = Array.from(
            new Set(
                Object.values(resumes)
                    .map((resume) => resume.globalSettings?.fontFamily)
                    .filter(Boolean)
            )
        );

        if (fontFamilies.length === 0) return;

        let cancelled = false;
        const warmFonts = () => {
            if (cancelled) return;
            fontFamilies.forEach((fontFamily) => {
                preloadFontFamily(fontFamily).catch((error) => {
                    console.warn("Failed to preload resume font:", error);
                });
            });
        };

        const supportsIdleCallback =
            typeof window !== "undefined" &&
            typeof window.requestIdleCallback === "function";
        const idleCallback = supportsIdleCallback
            ? window.requestIdleCallback(warmFonts, { timeout: 2500 })
            : globalThis.setTimeout(warmFonts, 1000);

        return () => {
            cancelled = true;
            if (
                supportsIdleCallback &&
                typeof window !== "undefined" &&
                typeof window.cancelIdleCallback === "function"
            ) {
                window.cancelIdleCallback(idleCallback as number);
            } else {
                globalThis.clearTimeout(idleCallback);
            }
        };
    }, [resumes]);

    const applyTemplateTheme = (newId: string, templateId: string) => {
        const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;
        const { resumes: all, updateResume } = useResumeStore.getState();
        const resume = all[newId];
        if (!resume) return;
        updateResume(newId, {
            globalSettings: {
                ...resume.globalSettings,
                themeColor: template.colorScheme.primary,
                sectionSpacing: template.spacing.sectionGap,
                paragraphSpacing: template.spacing.itemGap,
                pagePadding: template.spacing.contentPadding,
            },
            basic: {
                ...resume.basic,
                layout: template.basic.layout,
            },
        });
    };

    /** One-click create with the default (first) template into the workbench. */
    const handleQuickCreate = () => {
        const templateId = DEFAULT_TEMPLATES[0]?.id ?? null;
        const newId = createResume(templateId, false);
        if (templateId) applyTemplateTheme(newId, templateId);
        setActiveResume(newId);
        router.push({ to: "/app/workbench/$id", params: { id: newId } });
    };

    const handleCreateFromModal = (templateId: string | null) => {
        const isBlank = !templateId;
        const newId = createResume(templateId, isBlank);
        if (templateId) applyTemplateTheme(newId, templateId);
        setIsCreateModalOpen(false);
        setActiveResume(newId);
        router.push({ to: "/app/workbench/$id", params: { id: newId } });
    };

    const duplicateResume = async (resume: any) => {
        const { generateUUID } = await import("@/utils/uuid");
        const now = new Date().toISOString();

        const { id, ...rest } = resume;
        const newResume = {
            ...rest,
            id: generateUUID(),
            title: `${resume.title || t("dashboard.resumes.untitled")} - ${t("common.copy")}`,
            createdAt: now,
            updatedAt: now,
        };

        addResume(newResume);
        toast.success(t("previewDock.copyResume.success"));
    };

    const importResumeFromJson = async (file: File) => {
        const content = await file.text();
        const config = JSON.parse(content);
        const now = new Date().toISOString();
        const { generateUUID } = await import("@/utils/uuid");
        const { initialResumeState } = await import("@/config/initialResumeData");

        const newResume = {
            ...initialResumeState,
            ...config,
            id: generateUUID(),
            createdAt: now,
            updatedAt: now,
        };
        const resumeId = addResume(newResume);
        setActiveResume(resumeId);
        setIsImportDialogOpen(false);
        toast.success(t("dashboard.resumes.importSuccess"));
        router.push({ to: "/app/workbench/$id", params: { id: resumeId } });
    };

    const handleJsonFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || isImporting) return;

        try {
            setIsImporting(true);
            await importResumeFromJson(file);
        } catch (error) {
            console.error("Import JSON error:", error);
            toast.error(t("dashboard.resumes.importError"));
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <ScrollArea className="h-[calc(100vh-2rem)] w-full">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 space-y-6 py-8"
            >
                <motion.div
                    className="flex w-full items-center justify-center px-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <SpaceStatusBar />
                </motion.div>

                <motion.div
                    className="px-4 sm:px-6 flex items-center justify-between"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        {t("dashboard.resumes.myResume")}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <AnimatedImportButton onClick={() => setIsImportDialogOpen(true)} t={t} />
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <Button
                                onClick={handleQuickCreate}
                                variant="default"
                                className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("dashboard.resumes.create")}
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    className="flex-1 w-full p-3 sm:p-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={handleQuickCreate}
                        >
                            <Card
                                className={cn(
                                    "relative border border-dashed cursor-pointer transition-all duration-200 aspect-[210/297] flex flex-col",
                                    "hover:border-gray-400 hover:bg-gray-50",
                                    "dark:hover:border-primary dark:hover:bg-primary/10"
                                )}
                            >
                                <CardContent className="flex-1 p-0 text-center flex flex-col items-center justify-center">
                                    <motion.div
                                        className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-primary/10"
                                        whileHover={{ rotate: 90 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Plus className="h-8 w-8 text-gray-600 dark:text-primary" />
                                    </motion.div>
                                    <CardTitle className="text-xl text-gray-900 dark:text-gray-100 px-4">
                                        {t("dashboard.resumes.newResume")}
                                    </CardTitle>
                                    <CardDescription className="mt-2 text-gray-600 dark:text-gray-400 px-4">
                                        {t("dashboard.resumes.newResumeDescription")}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <AnimatePresence>
                            {Object.entries(resumes)
                                .sort(([, a], [, b]) => {
                                    const dateA = new Date(a.createdAt || 0).getTime();
                                    const dateB = new Date(b.createdAt || 0).getTime();
                                    return dateB - dateA;
                                })
                                .map(([id, resume], index) => (
                                    <ResumeCardItem
                                        key={id}
                                        id={id}
                                        resume={resume}
                                        t={t}
                                        locale={locale}
                                        router={router}
                                        deleteResume={deleteResume}
                                        duplicateResume={duplicateResume}
                                        index={index}
                                    />
                                ))}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <CreateResumeModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    onCreate={handleCreateFromModal}
                />

                <ImportResumeDialog
                    open={isImportDialogOpen}
                    isImporting={isImporting}
                    onOpenChange={setIsImportDialogOpen}
                    jsonFileInputRef={jsonFileInputRef}
                    onJsonFileChange={handleJsonFileChange}
                />
            </motion.div>
        </ScrollArea>
    );
};
