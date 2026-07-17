package com.forge.controller;

import com.forge.dto.ProjectDto;
import com.forge.model.Project;
import com.forge.model.Workspace;
import com.forge.repository.ProjectRepository;
import com.forge.repository.WorkspaceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;

    public ProjectController(ProjectRepository projectRepository, WorkspaceRepository workspaceRepository) {
        this.projectRepository = projectRepository;
        this.workspaceRepository = workspaceRepository;
    }

    @GetMapping
    public List<ProjectDto.Response> listProjects(
        @PathVariable UUID workspaceId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        findOwnedWorkspaceOrThrow(workspaceId, jwt);
        return projectRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId)
            .stream()
            .map(ProjectDto.Response::from)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDto.Response createProject(
        @PathVariable UUID workspaceId,
        @Valid @RequestBody ProjectDto.CreateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        Workspace workspace = findOwnedWorkspaceOrThrow(workspaceId, jwt);
        Project project = new Project(workspace, request.name());
        return ProjectDto.Response.from(projectRepository.save(project));
    }

    @PatchMapping("/{projectId}")
    public ProjectDto.Response renameProject(
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId,
        @Valid @RequestBody ProjectDto.UpdateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        findOwnedWorkspaceOrThrow(workspaceId, jwt);
        Project project = findProjectInWorkspaceOrThrow(workspaceId, projectId);
        project.setName(request.name());
        return ProjectDto.Response.from(projectRepository.save(project));
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(
        @PathVariable UUID workspaceId,
        @PathVariable UUID projectId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        findOwnedWorkspaceOrThrow(workspaceId, jwt);
        Project project = findProjectInWorkspaceOrThrow(workspaceId, projectId);
        projectRepository.delete(project);
    }

    private Workspace findOwnedWorkspaceOrThrow(UUID workspaceId, Jwt jwt) {
        return workspaceRepository.findById(workspaceId)
            .filter(workspace -> workspace.getOwnerSub().equals(jwt.getSubject()))
            .orElseThrow(() -> new NoSuchElementException("Workspace not found"));
    }

    private Project findProjectInWorkspaceOrThrow(UUID workspaceId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new NoSuchElementException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            throw new NoSuchElementException("Project not found in this workspace");
        }
        return project;
    }
}