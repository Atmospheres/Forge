package com.forge.controller;

import com.forge.config.TestSecurityConfig;
import com.forge.model.Project;
import com.forge.model.Workspace;
import com.forge.repository.ProjectRepository;
import com.forge.repository.WorkspaceRepository;
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

@WebMvcTest(controllers = ProjectController.class)
@Import(TestSecurityConfig.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @MockitoBean
    private ProjectRepository projectRepository;

    @MockitoBean
    private WorkspaceRepository workspaceRepository;

    private static final String OWNER_SUB = "auth0|owner-123";
    private static final String OTHER_USER_SUB = "auth0|someone-else";

    @Test
    void listProjects_workspaceOwnedBySomeoneElse_returns404() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Not Yours", OTHER_USER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(get("/api/workspaces/{workspaceId}/projects", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNotFound());

        // Ownership check should short-circuit before ever querying projects
        verify(projectRepository, never()).findByWorkspaceIdOrderByCreatedAtAsc(any());
    }

    @Test
    void listProjects_workspaceOwnedByCaller_returns200() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Mine", OWNER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(projectRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId)).thenReturn(List.of());

        mockMvc.perform(get("/api/workspaces/{workspaceId}/projects", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isOk());
    }

    @Test
    void createProject_workspaceOwnedBySomeoneElse_returns404AndDoesNotSave() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Not Yours", OTHER_USER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(post("/api/workspaces/{workspaceId}/projects", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly("Sneaky Project"))))
            .andExpect(status().isNotFound());

        verify(projectRepository, never()).save(any());
    }

    @Test
    void renameProject_projectBelongsToADifferentWorkspace_returns404() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        UUID otherWorkspaceId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();

        Workspace workspace = new Workspace("Mine", OWNER_SUB);
        Workspace otherWorkspace = mock(Workspace.class);
        when(otherWorkspace.getId()).thenReturn(otherWorkspaceId);

        Project project = mock(Project.class);
        when(project.getId()).thenReturn(projectId);
        when(project.getWorkspace()).thenReturn(otherWorkspace); // project actually lives elsewhere

        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        mockMvc.perform(patch("/api/workspaces/{workspaceId}/projects/{projectId}", workspaceId, projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly("New Name"))))
            .andExpect(status().isNotFound());

        verify(projectRepository, never()).save(any());
    }

    @Test
    void deleteProject_ownedThroughCorrectWorkspace_deletesIt() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();

        Workspace workspace = mock(Workspace.class);
        when(workspace.getId()).thenReturn(workspaceId);
        when(workspace.getOwnerSub()).thenReturn(OWNER_SUB);

        Project project = mock(Project.class);
        when(project.getId()).thenReturn(projectId);
        when(project.getWorkspace()).thenReturn(workspace);

        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        mockMvc.perform(delete("/api/workspaces/{workspaceId}/projects/{projectId}", workspaceId, projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNoContent());

        verify(projectRepository).delete(project);
    }
@Test
    void createProject_blankName_returns400AndDoesNotSave() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Mine", OWNER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(post("/api/workspaces/{workspaceId}/projects", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly(""))))
            .andExpect(status().isBadRequest());

        verify(projectRepository, never()).save(any());
    }

    @Test
    void renameProject_blankName_returns400AndDoesNotSave() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();

        Workspace workspace = mock(Workspace.class);
        when(workspace.getId()).thenReturn(workspaceId);
        when(workspace.getOwnerSub()).thenReturn(OWNER_SUB);

        Project project = mock(Project.class);
        when(project.getId()).thenReturn(projectId);
        when(project.getWorkspace()).thenReturn(workspace);

        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        mockMvc.perform(patch("/api/workspaces/{workspaceId}/projects/{projectId}", workspaceId, projectId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly(""))))
            .andExpect(status().isBadRequest());

        verify(projectRepository, never()).save(any());
    }

    private record NameOnly(String name) {}
}