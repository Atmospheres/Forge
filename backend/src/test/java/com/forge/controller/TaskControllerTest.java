package com.forge.controller;

import com.forge.config.TestSecurityConfig;
import com.forge.model.Project;
import com.forge.model.Task;
import com.forge.model.Workspace;
import com.forge.repository.ProjectRepository;
import com.forge.repository.TaskRepository;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TaskController.class)
@Import(TestSecurityConfig.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @MockitoBean
    private TaskRepository taskRepository;

    @MockitoBean
    private ProjectRepository projectRepository;

    private static final String OWNER_SUB = "auth0|owner-123";
    private static final String OTHER_USER_SUB = "auth0|someone-else";

    private Project projectOwnedBy(UUID projectId, String ownerSub) {
        Workspace workspace = mock(Workspace.class);
        when(workspace.getOwnerSub()).thenReturn(ownerSub);

        Project project = mock(Project.class);
        when(project.getId()).thenReturn(projectId);
        when(project.getWorkspace()).thenReturn(workspace);
        return project;
    }

    @Test
    void listTasks_projectsWorkspaceOwnedBySomeoneElse_returns404() throws Exception {
        UUID projectId = UUID.randomUUID();
        Project project = projectOwnedBy(projectId, OTHER_USER_SUB);
        when(projectRepository.findByIdWithWorkspace(projectId)).thenReturn(Optional.of(project));

        mockMvc.perform(get("/api/projects/{projectId}/tasks", projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNotFound());

        verify(taskRepository, never()).findByProjectIdOrderByPositionAsc(any());
    }

    @Test
    void listTasks_projectsWorkspaceOwnedByCaller_returns200() throws Exception {
        UUID projectId = UUID.randomUUID();
        Project project = projectOwnedBy(projectId, OWNER_SUB);
        when(projectRepository.findByIdWithWorkspace(projectId)).thenReturn(Optional.of(project));
        when(taskRepository.findByProjectIdOrderByPositionAsc(projectId)).thenReturn(List.of());

        mockMvc.perform(get("/api/projects/{projectId}/tasks", projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isOk());
    }

    @Test
    void createTask_projectsWorkspaceOwnedBySomeoneElse_returns404AndDoesNotSave() throws Exception {
        UUID projectId = UUID.randomUUID();
        Project project = projectOwnedBy(projectId, OTHER_USER_SUB);
        when(projectRepository.findByIdWithWorkspace(projectId)).thenReturn(Optional.of(project));

        mockMvc.perform(post("/api/projects/{projectId}/tasks", projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new TitleOnly("Sneaky Task"))))
            .andExpect(status().isNotFound());

        verify(taskRepository, never()).save(any());
    }

    @Test
    void updateTask_taskBelongsToADifferentProject_returns404() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID otherProjectId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Project project = projectOwnedBy(projectId, OWNER_SUB);
        when(projectRepository.findByIdWithWorkspace(projectId)).thenReturn(Optional.of(project));

        Project otherProject = mock(Project.class);
        when(otherProject.getId()).thenReturn(otherProjectId);

        Task task = mock(Task.class);
        when(task.getId()).thenReturn(taskId);
        when(task.getProject()).thenReturn(otherProject); // task actually lives in a different project
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        mockMvc.perform(patch("/api/projects/{projectId}/tasks/{taskId}", projectId, taskId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new StatusOnly("DONE"))))
            .andExpect(status().isNotFound());

        verify(taskRepository, never()).save(any());
    }

    @Test
    void deleteTask_ownedThroughCorrectProjectAndWorkspace_deletesIt() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();

        Project project = projectOwnedBy(projectId, OWNER_SUB);
        when(projectRepository.findByIdWithWorkspace(projectId)).thenReturn(Optional.of(project));

        Task task = mock(Task.class);
        when(task.getId()).thenReturn(taskId);
        when(task.getProject()).thenReturn(project);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        mockMvc.perform(delete("/api/projects/{projectId}/tasks/{taskId}", projectId, taskId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNoContent());

        verify(taskRepository).delete(task);
    }

@Test
    void createTask_blankTitle_returns400AndDoesNotSave() throws Exception {
        UUID projectId = UUID.randomUUID();
        Project project = projectOwnedBy(projectId, OWNER_SUB);
        when(projectRepository.findByIdWithWorkspace(projectId)).thenReturn(Optional.of(project));

        mockMvc.perform(post("/api/projects/{projectId}/tasks", projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new TitleOnly(""))))
            .andExpect(status().isBadRequest());

        verify(taskRepository, never()).save(any());
    }

    private record TitleOnly(String title) {}
    private record StatusOnly(String status) {}
}